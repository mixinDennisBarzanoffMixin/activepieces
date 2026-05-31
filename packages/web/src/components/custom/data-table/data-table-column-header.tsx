import { Column } from '@tanstack/solid-table';
import { ArrowDown, ArrowUp, ArrowUpDown, LucideIcon } from 'lucide-solid';

import { Button } from '@/components/ui/button';

interface DataTableColumnHeaderProps<TData, TValue> extends any {
  column: Column<TData, TValue>;
  title: string;
  icon?: LucideIcon;
  sortable?: boolean;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  icon: Icon,
  sortable = false,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (sortable) {
    const sortDirection = column.getIsSorted();
    const SortIcon =
      sortDirection === 'desc'
        ? ArrowDown
        : sortDirection === 'asc'
        ? ArrowUp
        : ArrowUpDown;

    return (
      <Button
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          if (sortDirection === false) {
            column.toggleSorting(false, false);
          } else if (sortDirection === 'asc') {
            column.toggleSorting(true, false);
          } else {
            column.clearSorting();
          }
        }}
        class={`h-auto text-foreground p-0 hover:bg-transparent -ml-3 ${className}`}
      >
        <Show when={Icon}>
          <Icon class="h-4 w-4 text-foreground flex-shrink-0 mr-2" />
        </Show>
        {title}
        <SortIcon class="ml-2 h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className={`flex items-center justify-start space-x-2 whitespace-nowrap ${className}`}
    >
      <Show when={Icon}>
        <Icon class="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </Show>
      <div className="text-xs font-normal text-foreground">{title}</div>
    </div>
  );
}
