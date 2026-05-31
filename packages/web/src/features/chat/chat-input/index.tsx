import { isNil } from '@activepieces/shared';
import { ArrowUpIcon, Paperclip } from 'lucide-solid';
import { createSignal } from 'solid-js';

import { Button } from '@/components/ui/button';
import { ResizableTextareaProps, Textarea } from '@/components/ui/textarea';
import { useElementSize } from '@/hooks/use-element-size';
import { cn } from '@/lib/utils';

import { FileInputPreview } from './file-input-preview';

export interface ChatMessage {
  textContent: string;
  files: File[];
}

interface ChatInputProps extends Omit<ResizableTextareaProps, 'onSubmit'> {
  onSendMessage: (message: ChatMessage) => void;
  disabled?: boolean;
  placeholder?: string;
}

function ChatInput(props: ChatInputProps) {
  const {
    className,
    onSendMessage,
    disabled = false,
    placeholder = 'Type your message here...',
    ref,
    ...rest
  } = props;
  const [input, setInput] = createSignal('');
  const [files, setFiles] = createSignal<File[]>([]);
  let fileInputRef: HTMLInputElement | undefined;
  let filesPreviewContainerRef: HTMLDivElement | undefined;
  const filesPreviewContainerSize = useElementSize({
    get current() {
      return filesPreviewContainerRef ?? null;
    },
  });

    const handleFileChange = (selectedFiles: File[]) => {
      if (selectedFiles) {
        setFiles((prevFiles) => {
          const newFiles = [...prevFiles, ...selectedFiles];
          return newFiles;
        });
        if (fileInputRef) {
          fileInputRef.value = '';
        }
      }
    };

    const removeFile = (index: number) => {
      setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: Event) => {
      e.preventDefault();
      if ((!input() && files().length === 0) || disabled) return;

      onSendMessage({
        textContent: input(),
        files: files(),
      });

      // Clear input fields
      setInput('');
      setFiles([]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!disabled && (input() || files().length > 0)) {
          handleSubmit(e as unknown as Event);
        }
      }
    };

    return (
      <div
        className="w-full"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const selectedFiles = Array.from(e.dataTransfer.files);
          handleFileChange(selectedFiles);
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="rounded-lg border shadow-xs">
            {files().length > 0 && (
              <div
                className="px-4 py-3 w-full transition-all overflow-hidden"
                style={{
                  height: `${filesPreviewContainerSize().height}px`,
                }}
              >
                <div
                  ref={(el) => (filesPreviewContainerRef = el)}
                  className="flex items-start gap-3 flex-wrap"
                >
                  {files().map((file, index) => (
                    <FileInputPreview
                      key={`${file.name}-${index}`}
                      file={file}
                      index={index}
                      onRemove={removeFile}
                    />
                  ))}
                </div>
              </div>
            )}
            <Textarea
              autoComplete="off"
              ref={ref}
              autoFocus
              minRows={1}
              maxRows={6}
              name="message"
              class={cn(
                'px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 w-full resize-none border-0 shadow-none focus-visible:ring-0',
                className,
              )}
              value={input()}
              onKeyDown={handleKeyDown}
              onInput={(e) => setInput(e.currentTarget.value)}
              onPaste={(e) => {
                const selectedFiles = Array.from(e.clipboardData.items)
                  .filter((item) => item.kind === 'file')
                  .map((item) => item.getAsFile())
                  .filter((item) => !isNil(item));
                handleFileChange(selectedFiles);
              }}
              placeholder={placeholder}
              disabled={disabled}
              {...rest}
            />
            <div className="flex justify-end items-center gap-4 px-4 py-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Paperclip class="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </label>
              <input
                ref={(el) => (fileInputRef = el)}
                id="file-upload"
                type="file"
                multiple
                onChange={(e) => {
                  handleFileChange(Array.from(e.currentTarget.files ?? []));
                }}
                className="hidden"
              />
              <Button
                disabled={(!input() && files().length === 0) || disabled}
                type="submit"
                size="icon"
                variant="default"
              >
                <ArrowUpIcon class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
}

ChatInput.displayName = 'ChatInput';

export { ChatInput };
