import { Download, X } from 'lucide-solid';
import { createEffect, Show, onCleanup } from 'solid-js';

import { Button } from '@/components/ui/button';

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
}

export const ImageDialog = (props: ImageDialogProps) => {
  createEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onOpenChange(false);
    };
    document.addEventListener('keydown', handler);
    onCleanup(() => {
      document.removeEventListener('keydown', handler);
    });
  });
  return (
    <Show when={props.open}>
      <div
        class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center transition-colors duration-300"
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === 'Escape') props.onOpenChange(false);
        }}
      >
        <div class="bg-transparent border-none shadow-none flex items-center justify-center px-4">
          <div class="relative">
            <img
              src={props.imageUrl || ''}
              alt="Full size image"
              class="h-auto object-contain max-h-[90vh] sm:max-w-[90vw] shadow-xs rounded-md"
            />
          </div>
          <div class="flex gap-2 absolute top-2 right-2">
            <Button
              size="icon"
              variant="accent"
              onClick={() => {
                const link = document.createElement('a');
                link.href = props.imageUrl || '';
                link.download = 'image';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download class="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="accent"
              onClick={() => props.onOpenChange(false)}
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
};
