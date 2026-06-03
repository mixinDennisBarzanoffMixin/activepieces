import { t } from 'i18next';
import { createEffect, createSignal, Show } from 'solid-js';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { useCellContext } from './cell-context';

function isValidDate(date: string) {
  return !isNaN(new Date(date).getTime());
}
function getFormattedDate(date: string) {
  return isValidDate(date) ? formatUtils.formatDateOnly(new Date(date)) : '';
}
function DateEditor() {
  const cell = useCellContext();
  const [date, setDate] = createSignal<Date | undefined>(
    isValidDate(cell.value) ? new Date(cell.value) : undefined,
  );
  const [month, setMonth] = createSignal<Date | undefined>(
    isValidDate(cell.value) ? new Date(cell.value) : undefined,
  );
  const [inputValue, setInputValue] = createSignal(
    getFormattedDate(cell.value),
  );
  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      setInputValue(formatUtils.formatDateOnly(newDate));
      cell.handleCellChange(newDate.toISOString());
      cell.setIsEditing(false);
    }
  };

  let inputRef: HTMLInputElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  createEffect(() => {
    if (cell.isEditing) {
      requestAnimationFrame(() => {
        inputRef?.focus();
      });
    } else {
      setInputValue(getFormattedDate(cell.value));
    }
  });
  return (
    <div class="h-full w-full" ref={containerRef}>
      <Popover
        open={cell.isEditing}
        onOpenChange={(open) => {
          if (!open) {
            cell.setIsEditing(false);
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            class={cn(
              'w-full h-full flex items-center justify-between gap-2',
              'bg-background text-sm px-2',
              'focus:outline-hidden',
              {
                'border-2 border-primary': cell.isEditing,
                'border-transparent bg-transparent!': !cell.isEditing,
              },
            )}
          >
            <Show when={cell.isEditing}>
              <input
                ref={inputRef}
                placeholder={t('mm/dd/yyy')}
                value={inputValue()}
                type="text"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onInput={(e) => {
                  setInputValue(e.currentTarget.value);
                  if (isValidDate(e.currentTarget.value)) {
                    setDate(new Date(e.currentTarget.value));
                    setMonth(new Date(e.currentTarget.value));
                  } else {
                    setDate(undefined);
                  }
                }}
                onBlur={(e) => {
                  if (!containerRef?.contains(e.target)) {
                    cell.handleCellChange(date()?.toISOString() ?? '');
                  }
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    cell.handleCellChange(date()?.toISOString() ?? '');
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
                  {
                    'border-transparent bg-transparent!': !cell.isEditing,
                  },
                )}
                autoComplete="off"
              />
            </Show>
            <Show when={!cell.isEditing}>
              <div class="flex grow h-full min-w-0">
                {getFormattedDate(cell.value)}
              </div>
            </Show>
          </button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            month={month}
            onMonthChange={setMonth}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateEditor };
