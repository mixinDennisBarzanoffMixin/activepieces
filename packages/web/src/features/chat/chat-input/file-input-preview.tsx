import { FileIcon, X } from 'lucide-solid';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';

type FileInputPreviewProps = {
  file: File;
  index: number;
  onRemove: (index: number) => void;
};

export const FileInputPreview = (props: FileInputPreviewProps) => {
  const isImage = props.file.type.startsWith('image/');
  const isVideo = props.file.type.startsWith('video/');

  return (
    <div class="relative inline-block mr-2 mt-2 mb-3">
      <Show when={isImage}>
        <img
          src={URL.createObjectURL(props.file)}
          alt={props.file.name}
          class="w-20 h-20 object-cover rounded-lg"
        />
      </Show>
      <Show when={isVideo}>
        <video
          src={URL.createObjectURL(props.file)}
          class="w-20 h-20 object-cover rounded-lg"
        />
      </Show>
      <Show when={!isImage && !isVideo}>
        <div class="w-20 h-20 bg-foreground text-background rounded-lg flex items-center justify-center">
          <FileIcon class="w-8 h-8" />
        </div>
      </Show>
      <Button
        variant="destructive"
        size="icon"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          props.onRemove(props.index);
        }}
        class="absolute -top-2 -right-2 rounded-full p-1 size-6"
      >
        <X class="w-3 h-3" />
      </Button>
      <p class="text-xs mt-1 truncate w-20">{props.file.name}</p>
    </div>
  );
};
