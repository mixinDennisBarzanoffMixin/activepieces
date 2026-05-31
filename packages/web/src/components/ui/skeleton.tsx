import { For } from 'solid-js';

import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: JSX.IntrinsicElements['div']) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-neutral-700',
        className,
      )}
      {...props}
    />
  );
}

function SkeletonList({
  className,
  numberOfItems = 3,
  ...props
}: JSX.IntrinsicElements['div'] & {
  numberOfItems?: number;
}) {
  const array = Array(numberOfItems).fill(null);
  return (
    <div className="space-y-3">
      <For each={array}>
        {(_, index) => (
          <Skeleton class={cn('h-4 w-full', className)} {...props} />
        )}
      </For>
    </div>
  );
}

export { Skeleton, SkeletonList };
