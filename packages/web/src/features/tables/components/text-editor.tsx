import { createEffect, createSignal, Show } from 'solid-js';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { useCellContext } from './cell-context';

const TextEditor = () => {
  const cell = useCellContext();
  let textAreaRef: HTMLTextAreaElement | undefined;
  const [inputValue, setInputValue] = createSignal(cell.value);
  createEffect(() => {
    if (cell.isEditing) {
      textAreaRef?.focus();
      setInputValue(cell.value);
    } else {
      setInputValue(cell.value);
    }
  });
  return (
    <div class="h-full relative w-full relative">
      <div
        classlist={{
          'h-min-[300px] w-min-[calc(100%+50px)] w-full absolute top-0  z-50 border-2 border-primary  drop-shadow-md':
            cell.isEditing,
        }}
      >
        <Show when={cell.isEditing}>
          <Textarea
            ref={textAreaRef}
            value={inputValue()}
            onInput={(e) => {
              setInputValue(e.currentTarget.value);
            }}
            onBlur={() => {
              cell.handleCellChange(inputValue());
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              e.stopPropagation();
              if (e.key === 'Enter' && !e.shiftKey) {
                cell.handleCellChange(inputValue());
                e.preventDefault();
              }
              if (e.key === 'Escape') {
                cell.setIsEditing(false);
                e.preventDefault();
              }
            }}
            minRows={4}
            maxRows={6}
            class={cn(
              'flex-1 h-full min-w-0 rounded-none',
              'border-none text-sm px-2 resize-none ',
              'focus:outline-hidden',
              'placeholder:text-muted-foreground',
            )}
            autoComplete="off"
          />
        </Show>
        <Show when={!cell.isEditing}>
          <div class="flex grow h-full w-full ">
            {cell.value.replaceAll('\n', ' ')}
          </div>
        </Show>
      </div>
    </div>
  );
};
export { TextEditor };
