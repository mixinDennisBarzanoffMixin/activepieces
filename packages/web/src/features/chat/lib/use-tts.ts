import { createEffect, createSignal } from 'solid-js';

const isTtsSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

function useTts() {
  const [isSpeaking, setIsSpeaking] = createSignal(false);
  const utteranceRef = null;

  const speak = (text: string) => {
    if (!isTtsSupported) return;

    window.speechSynthesis.cancel();
    utteranceRef.current = null;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = navigator.language;
    utterance.rate = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (isTtsSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    utteranceRef.current = null;
  };

  createEffect(() => {
    return () => {
      if (isTtsSupported) {
        window.speechSynthesis.cancel();
      }
    };
  });

  return { isSpeaking, isSupported: isTtsSupported, speak, stop };
}

export { useTts };
