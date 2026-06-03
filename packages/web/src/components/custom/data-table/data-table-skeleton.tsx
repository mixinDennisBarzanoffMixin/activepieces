import { For, mergeProps } from 'solid-js';

import { Skeleton } from '@/components/ui/skeleton';

export function DataTableSkeleton(_props: { skeletonRowCount?: number }) {
  const props = mergeProps({ skeletonRowCount: 10 }, _props);
  return (
    <div>
      <div class="p-2">
        <For
          each={Array.from({ length: props.skeletonRowCount }).map((_, i) => i)}
        >
          {(rowIndex) => <TableRowSkeleton key={rowIndex} />}
        </For>
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div
      id="table-loading"
      class="w-full h-9 mb-3 rounded-sm"
      data-testid="header-cell"
    >
      <Skeleton class="w-full min-h-9" />
    </div>
  );
}
