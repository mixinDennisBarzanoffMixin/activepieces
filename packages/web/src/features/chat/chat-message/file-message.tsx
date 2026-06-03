import { FileIcon, VideoIcon } from 'lucide-solid';
import { Show } from 'solid-js';

interface FileMessageProps {
  content: string;
  mimeType?: string;
  fileName?: string;
  role?: 'user' | 'bot';
}

export const FileMessage = (props: FileMessageProps) => {
  return (
    <a
      class="p-2 w-80 rounded-lg border px-2 max-w-full hover:bg-muted transition-colors cursor-pointer"
      href={props.content}
      download={props.fileName ?? 'file'}
    >
      <div class="flex flex-row items-center gap-2">
        <div class="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
          <div class="h-full w-full flex items-center justify-center bg-foreground text-background">
            <Show
              when={props.mimeType?.startsWith('video/')}
              fallback={<FileIcon class="h-5 w-5" />}
            >
              <VideoIcon class="h-5 w-5" />
            </Show>
          </div>
        </div>
        <div class="overflow-hidden flex flex-col gap-1">
          <div class="truncate font-semibold text-sm leading-none">
            {props.fileName ??
              (props.role === 'user' ? 'Untitled File' : 'Download File')}
          </div>
          <Show when={props.fileName}>
            <div class="truncate text-sm text-token-text-tertiary leading-none">
              {props.role === 'user' ? 'View File' : 'Download File'}
            </div>
          </Show>
        </div>
      </div>
    </a>
  );
};
