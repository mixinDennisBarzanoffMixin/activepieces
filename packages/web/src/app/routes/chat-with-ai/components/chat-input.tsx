import { createEffect, createSignal, For, Show } from "solid-js";
import { t } from 'i18next';
import { ArrowUp, Mic, Paperclip, Square, X } from 'lucide-solid';
import { toast } from 'solid-sonner';

import {
  FileUpload,
  FileUploadContent,
  FileUploadTrigger,
} from '@/components/prompt-kit/file-upload';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';
import { VoiceWaveformBars } from '@/features/chat/components/voice-waveform';
import { useVoiceInput } from '@/features/chat/lib/use-voice-input';

export function ChatInput({
  isStreaming,
  onSend,
  onStop,
  placeholder,
  leftActions,
  rightActions,
}: {
  isStreaming: boolean;
  onSend: (text: string, files?: File[]) => void;
  onStop?: () => void;
  placeholder?: string;
  leftActions?: JSX.Element;
  rightActions?: JSX.Element;
}) {
  const [value, setValue] = createSignal('');
  const [attachedFiles, setAttachedFiles] = createSignal<File[]>([]);
  const [interimText, setInterimText] = createSignal('');

  const handleTranscript = (text: string) => {
      setValue((prev) => {
        const separator = prev.length > 0 ? ' ' : '';
        return prev + separator + text;
      });
      setInterimText('');
    };

  const handleVoiceError = (messageKey: string) => {
      toast.error(t(messageKey));
      setInterimText('');
    };

  const {
    isRecording,
    isSupported: isVoiceSupported,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceInput({
    onTranscript: handleTranscript,
    onInterim: setInterimText,
    onError: handleVoiceError,
  });

  createEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelRecording();
        setInterimText('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleSubmit = () => {
      if (!isStreaming && (value.trim() || attachedFiles.length > 0)) {
        onSend(
          value.trim(),
          attachedFiles.length > 0 ? attachedFiles : undefined,
        );
        setValue('');
        setAttachedFiles([]);
      }
    };

  const handleFilesAdded = (files: File[]) => {
      setAttachedFiles((prev) => [...prev, ...files]);
    };

  const canSend = value.trim().length > 0 || attachedFiles.length > 0;

  return (
    <FileUpload onFilesAdded={handleFilesAdded} multiple>
      <PromptInput
        isLoading={isStreaming}
        value={value}
        onValueChange={setValue}
        onSubmit={handleSubmit}
        class="border-0 rounded-none shadow-none"
      >
        <Show when={attachedFiles.length > 0}>
                                                    <div class="flex flex-wrap gap-2 px-3 pt-2">
                                                      <For each={attachedFiles}>{(file) => (
                                                                                                    <div
                                                                                                      key={file.name}
                                                                                                      class="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm"
                                                                                                      onClick={(e) => e.stopPropagation()}
                                                                                                    >
                                                                                                      <Paperclip class="size-3.5 shrink-0 text-muted-foreground" />
                                                                                                      <span class="max-w-[150px] truncate text-foreground/80">
                                                                                                        {file.name}
                                                                                                      </span>
                                                                                                      <button
                                                                                                        type="button"
                                                                                                        onClick={() =>
                                                                                                          setAttachedFiles((prev) =>
                                                                                                            prev.filter((f) => f.name !== file.name),
                                                                                                          )
                                                                                                        }
                                                                                                        class="text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
                                                                                                      >
                                                                                                        <X class="size-3.5" />
                                                                                                      </button>
                                                                                                    </div>
                                                                                                  )}</For>
                                                    </div>
                                                  </Show>
        <Show when={isRecording} fallback={(
                                                    <PromptInputTextarea
                                                      autoFocus
                                                      placeholder={placeholder ?? t('Tell me what you need...')}
                                                      class="min-h-[44px] text-sm"
                                                    />
                                                  )}>
                                                    <div class="min-h-[44px] px-3 py-2 text-sm text-foreground whitespace-pre-wrap break-words">
                                                      {interimText || (
                                                        <span class="text-muted-foreground">{t('Listening...')}</span>
                                                      )}
                                                    </div>
                                                  </Show>
        <PromptInputActions class="flex items-center justify-between">
          <div class="flex items-center gap-1">
            <PromptInputAction tooltip={t('Attach files')}>
              <FileUploadTrigger asChild>
                <div class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Paperclip class="size-4" />
                </div>
              </FileUploadTrigger>
            </PromptInputAction>
            {leftActions}
          </div>
          <div class="flex items-center gap-1">
            {rightActions}
            <Show when={isStreaming && onStop} fallback={<Show when={isRecording} fallback={canSend ? (
                                                                                                      <PromptInputAction tooltip={t('Send message')}>
                                                                                                        <Button
                                                                                                          variant="default"
                                                                                                          size="icon"
                                                                                                          class="h-7 w-7 rounded-full"
                                                                                                          onClick={handleSubmit}
                                                                                                          disabled={isStreaming}
                                                                                                        >
                                                                                                          <ArrowUp class="size-4" />
                                                                                                        </Button>
                                                                                                      </PromptInputAction>
                                                                                                    ) : isVoiceSupported ? (
                                                                                                      <PromptInputAction tooltip={t('Voice input')}>
                                                                                                        <button
                                                                                                          type="button"
                                                                                                          onClick={startRecording}
                                                                                                          class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                                                        >
                                                                                                          <Mic class="size-4" />
                                                                                                        </button>
                                                                                                      </PromptInputAction>
                                                                                                    ) : (
                                                                                                      <PromptInputAction tooltip={t('Send message')}>
                                                                                                        <Button
                                                                                                          variant="default"
                                                                                                          size="icon"
                                                                                                          class="h-7 w-7 rounded-full"
                                                                                                          onClick={handleSubmit}
                                                                                                          disabled={true}
                                                                                                        >
                                                                                                          <ArrowUp class="size-4" />
                                                                                                        </Button>
                                                                                                      </PromptInputAction>
                                                                                                     )}>
                                                                                                       <PromptInputAction tooltip={t('Stop recording')}>
                                                                                                        <Button
                                                                                                          variant="outline"
                                                                                                          class="h-7 gap-1.5 rounded-full px-3"
                                                                                                          onClick={stopRecording}
                                                                                                        >
                                                                                                          <VoiceWaveformBars />
                                                                                                          <span class="text-xs font-medium">{t('Stop')}</span>
                                                                                                        </Button>
                                                                                                      </PromptInputAction>
                                                                                                    </Show>}
            >
                                                                                <PromptInputAction tooltip={t('Stop')}>
                                                                                  <Button
                                                                                    variant="default"
                                                                                    size="icon"
                                                                                    class="h-7 w-7 rounded-full"
                                                                                    onClick={onStop}
                                                                                  >
                                                                                    <Square class="size-3 fill-current" />
                                                                                  </Button>
                                                                                                      </PromptInputAction>
                                                                              </Show>
          </div>
        </PromptInputActions>
      </PromptInput>

      <FileUploadContent>
        <div class="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm">
          <div class="bg-background/90 m-4 w-full max-w-md rounded-lg border p-8 shadow-lg">
            <div class="mb-4 flex justify-center">
              <Paperclip class="text-muted-foreground size-8" />
            </div>
            <h3 class="mb-2 text-center text-base font-medium">
              {t('Drop files here')}
            </h3>
            <p class="text-muted-foreground text-center text-sm">
              {t('Release to add files to your message')}
            </p>
          </div>
        </div>
      </FileUploadContent>
    </FileUpload>
  );
}
