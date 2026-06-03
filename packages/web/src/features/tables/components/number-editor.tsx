import { createEffect, createSignal, Show } from 'solid-js';

import { cn } from '@/lib/utils';

import { useCellContext } from './cell-context';

const NumberEditor = () => {
  const cell = useCellContext();
  let inputRef: HTMLInputElement | undefined;
  const [inputValue, setInputValue] = createSignal(cell.value);
  const handleChange = (
    event: InputEvent & { currentTarget: HTMLInputElement },
  ) => {
    setInputValue(event.currentTarget.value);
  };

  createEffect(() => {
    if (cell.isEditing) {
      inputRef?.focus();
    } else {
      setInputValue(cell.value);
    }
  });

  return (
    <div class="h-full relative w-full">
      <div
        class={cn('h-full flex items-center gap-2', {
          'border-2 border-primary': cell.isEditing,
          'border-transparent': !cell.isEditing,
        })}
      >
        <Show when={cell.isEditing}>
          <input
            ref={inputRef}
            value={inputValue()}
            type={'number'}
            onInput={handleChange}
            onBlur={() => {
              cell.handleCellChange(inputValue());
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                cell.handleCellChange(inputValue());
                e.preventDefault();
              }
              if (e.key === 'Escape') {
                cell.setIsEditing(false);
                e.preventDefault();
              }
            }}
            class={cn(
              'flex-1 h-full min-w-0',
              'border-none text-sm px-2',
              'focus:outline-hidden',
              'placeholder:text-muted-foreground',
            )}
            autoComplete="off"
          />
        </Show>
        <Show when={!cell.isEditing}>
          <div class="flex grow h-full w-full ">{cell.value}</div>
        </Show>
      </div>
    </div>
  );
};
export { NumberEditor };
