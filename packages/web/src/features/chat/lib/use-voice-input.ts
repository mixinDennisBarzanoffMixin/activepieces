import { createEffect, createSignal } from 'solid-js';

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const win = globalThis as unknown as Record<string, unknown>;
  if (win.SpeechRecognition) {
    return win.SpeechRecognition as SpeechRecognitionConstructor;
  }
  if (win.webkitSpeechRecognition) {
    return win.webkitSpeechRecognition as SpeechRecognitionConstructor;
  }
  return null;
}

const speechRecognitionConstructor = getSpeechRecognitionConstructor();

function playTone({
  frequency,
  duration,
  ramp,
}: {
  frequency: number;
  duration: number;
  ramp: 'up' | 'down';
}) {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  if (ramp === 'up') {
    oscillator.frequency.linearRampToValueAtTime(
      frequency * 1.3,
      ctx.currentTime + duration,
    );
  } else {
    oscillator.frequency.linearRampToValueAtTime(
      frequency * 0.7,
      ctx.currentTime + duration,
    );
  }
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
  oscillator.onended = () => ctx.close();
}

function playStartSound() {
  playTone({ frequency: 600, duration: 0.15, ramp: 'up' });
}

function playStopSound() {
  playTone({ frequency: 500, duration: 0.12, ramp: 'down' });
}

function useVoiceInput({
  onTranscript,
  onInterim,
  onError,
}: {
  onTranscript: (text: string) => void;
  onInterim: (text: string) => void;
  onError: (message: string) => void;
}) {
  const [isRecording, setIsRecording] = createSignal(false);
  let recognitionRef: SpeechRecognitionInstance | null = null;
  let accumulatedTranscriptRef = '';
  let isCancellingRef = false;

  const stopRecording = () => {
    if (recognitionRef) {
      isCancellingRef = false;
      recognitionRef.stop();
    }
  };

  const cancelRecording = () => {
    if (recognitionRef) {
      isCancellingRef = true;
      recognitionRef.stop();
    }
  };

  const startRecording = () => {
    if (!speechRecognitionConstructor) {
      onError('Voice input is not available in this browser.');
      return;
    }

    accumulatedTranscriptRef = '';
    isCancellingRef = false;

    const recognition = new speechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          accumulatedTranscriptRef += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      onInterim(accumulatedTranscriptRef + interim);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        onError('Could not access microphone. Check browser permissions.');
      }
      setIsRecording(false);
      recognitionRef = null;
    };

    recognition.onend = () => {
      if (!isCancellingRef) {
        playStopSound();
        const finalText = accumulatedTranscriptRef.trim();
        if (finalText) {
          onTranscript(finalText);
        }
      }
      setIsRecording(false);
      recognitionRef = null;
      isCancellingRef = false;
    };

    recognitionRef = recognition;
    recognition.start();
    playStartSound();
    setIsRecording(true);
  };

  createEffect(() => {
    return () => {
      if (recognitionRef) {
        recognitionRef.stop();
        recognitionRef = null;
      }
    };
  });

  return {
    isRecording,
    isSupported: speechRecognitionConstructor !== null,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

export { useVoiceInput };
