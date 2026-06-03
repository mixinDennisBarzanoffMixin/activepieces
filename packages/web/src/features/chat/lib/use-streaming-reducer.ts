import { ChatAgentEventType, WebsocketClientEvent } from '@activepieces/shared';
import { UIMessageChunk } from 'ai';
import { onCleanup, createSignal } from 'solid-js';

import { useSocket } from '@/components/providers/socket-provider';

import { ChatUIMessage } from './chat-types';
import { chunkReducer, DataPart } from './chunk-reducer';

const THROTTLE_MS = 100;
const STREAM_TIMEOUT_MS = 10 * 60 * 1000;

export function useStreamingReducer({
  onDataPart,
  onStreamFinished,
  onStreamError,
}: {
  onDataPart: (part: DataPart) => void;
  onStreamFinished: (conversationId: string) => void;
  onStreamError: (params: {
    conversationId: string;
    errorMessage: string;
    errorCode?: string;
  }) => void;
}) {
  const socket = useSocket();

  const [streamingMessage, setStreamingMessage] =
    createSignal<ChatUIMessage | null>(null);
  const [streamPhase, setStreamPhase] = createSignal<StreamPhase>('idle');
  const [streamError, setStreamError] = createSignal<string | null>(null);

  let streamPhaseRef: StreamPhase = 'idle';
  let reducerStateRef: ReturnType<
    typeof chunkReducer.createStreamingState
  > | null = null;
  let chunkBufferRef: UIMessageChunk[] = [];
  let throttleTimerRef: ReturnType<typeof setTimeout> | null = null;
  let streamTimeoutRef: ReturnType<typeof setTimeout> | null = null;
  let cleanupRef: (() => void) | null = null;

  const updatePhase = (phase: StreamPhase) => {
    if (streamPhaseRef === phase) return;
    streamPhaseRef = phase;
    setStreamPhase(phase);
  };

  const flush = () => {
    throttleTimerRef = null;
    const chunks = chunkBufferRef;
    if (chunks.length === 0) return;
    chunkBufferRef = [];

    const dataParts = chunkReducer.extractDataParts({ chunks });
    for (const dp of dataParts) {
      onDataPart(dp);
    }

    const state = reducerStateRef;
    if (!state) return;

    chunkReducer.applyChunks({ state, chunks });
    setStreamingMessage(chunkReducer.snapshotMessage({ state }));
  };

  const scheduleFlush = () => {
    if (throttleTimerRef !== null) return;
    throttleTimerRef = setTimeout(flush, THROTTLE_MS);
  };

  const teardown = () => {
    if (cleanupRef) {
      cleanupRef();
      cleanupRef = null;
    }
    if (throttleTimerRef !== null) {
      clearTimeout(throttleTimerRef);
      throttleTimerRef = null;
    }
    if (streamTimeoutRef !== null) {
      clearTimeout(streamTimeoutRef);
      streamTimeoutRef = null;
    }
    chunkBufferRef = [];
    reducerStateRef = null;
  };

  onCleanup(teardown);

  const startStream = (conversationId: string) => {
    teardown();

    reducerStateRef = chunkReducer.createStreamingState();
    setStreamingMessage({
      id: reducerStateRef.message.id,
      role: 'assistant',
      parts: [],
    });
    updatePhase('awaiting-stream');
    setStreamError(null);

    const handleFinish = () => {
      flush();
      teardown();
      updatePhase('reconciling');
      onStreamFinished(conversationId);
    };

    const handleError = ({
      errorMessage,
      errorCode,
    }: {
      errorMessage: string;
      errorCode?: string;
    }) => {
      flush();
      teardown();
      setStreamError(errorMessage);
      updatePhase('reconciling');
      onStreamError({ conversationId, errorMessage, errorCode });
    };

    const handler = (event: SocketEvent) => {
      if (event.conversationId !== conversationId) return;

      if (event.type === String(ChatAgentEventType.CHUNK)) {
        updatePhase('streaming');
        const chunks = Array.isArray(event.data) ? event.data : [event.data];
        for (const chunk of chunks) {
          chunkBufferRef.push(chunk as UIMessageChunk);
        }
        scheduleFlush();

        if (streamTimeoutRef !== null) {
          clearTimeout(streamTimeoutRef);
        }
        streamTimeoutRef = setTimeout(() => {
          handleError({ errorMessage: 'Stream timed out' });
        }, STREAM_TIMEOUT_MS);
      } else if (event.type === String(ChatAgentEventType.ERROR)) {
        const errorData = event.data as { message?: string; code?: string };
        handleError({
          errorMessage: errorData.message ?? 'An error occurred',
          errorCode: errorData.code,
        });
      } else if (event.type === String(ChatAgentEventType.FINISHED)) {
        handleFinish();
      }
    };

    socket.on(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);

    streamTimeoutRef = setTimeout(() => {
      handleError({ errorMessage: 'Stream timed out' });
    }, STREAM_TIMEOUT_MS);

    cleanupRef = () => {
      socket.off(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
    };
  };

  const stopStream = () => {
    teardown();
    setStreamingMessage(null);
    setStreamError(null);
    updatePhase('idle');
  };

  const clearStreamingState = () => {
    setStreamingMessage(null);
    setStreamError(null);
    updatePhase('idle');
  };

  return {
    streamingMessage,
    streamPhase,
    streamError,
    startStream,
    stopStream,
    clearStreamingState,
  };
}

type SocketEvent = {
  conversationId: string;
  type: string;
  data: unknown;
};

type StreamPhase = 'idle' | 'awaiting-stream' | 'streaming' | 'reconciling';

export type { StreamPhase };
