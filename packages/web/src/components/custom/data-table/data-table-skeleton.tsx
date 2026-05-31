import { Skeleton } from '@/components/ui/skeleton';

export function DataTableSkeleton({
  skeletonRowCount = 10,
}: {
  skeletonRowCount?: number;
}) {
  return (
    <div>
      <div className="p-2">
        <For each={Array.from({ length: skeletonRowCount }).map((_, i) => i)}>
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
      className="w-full h-9 mb-3 rounded-sm"
      data-testid="header-cell"
    >
      <Skeleton class="w-full min-h-9" />
    </div>
  );
}
