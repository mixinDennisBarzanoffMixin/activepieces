import { Column } from '@tanstack/solid-table';
import { ArrowDown, ArrowUp, ArrowUpDown, LucideIcon } from 'lucide-solid';
import { createMemo, mergeProps, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  icon?: LucideIcon;
  sortable?: boolean;
  className?: string;
}

export function DataTableColumnHeader<TData, TValue>(
  _props: DataTableColumnHeaderProps<TData, TValue>,
) {
  const props = mergeProps({ sortable: false }, _props);
  const dir = createMemo(() => props.column.getIsSorted());
  const SortIcon = createMemo(() =>
    dir() === 'desc' ? ArrowDown : dir() === 'asc' ? ArrowUp : ArrowUpDown,
  );

  return (
    <Show
      when={props.sortable}
      fallback={
        <div
          class={cn(
            'flex items-center justify-start space-x-2 whitespace-nowrap',
            props.className,
          )}
        >
          <Show when={props.icon}>
            <props.icon class="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </Show>
          <div class="text-xs font-normal text-foreground">{props.title}</div>
        </div>
      }
    >
      <Button
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          if (dir() === false) {
            props.column.toggleSorting(false, false);
            return;
          }
          if (dir() === 'asc') {
            props.column.toggleSorting(true, false);
            return;
          }
          props.column.clearSorting();
        }}
        class={cn(
          'h-auto text-foreground p-0 hover:bg-transparent -ml-3',
          props.className,
        )}
      >
        <Show when={props.icon}>
          <props.icon class="h-4 w-4 text-foreground flex-shrink-0 mr-2" />
        </Show>
        {props.title}
        <Dynamic component={SortIcon()} class="ml-2 h-4 w-4" />
      </Button>
    </Show>
  );
}
