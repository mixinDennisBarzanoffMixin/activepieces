import { For, splitProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

function Skeleton(props: SkeletonProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <div
      data-slot="skeleton"
      class={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-neutral-700',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SkeletonList(props: SkeletonListProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'numberOfItems',
  ]);
  const array = () =>
    Array.from({ length: local.numberOfItems ?? 3 }, () => undefined);

  return (
    <div class="space-y-3">
      <For each={array()}>
        {() => (
          <Skeleton
            class={cn('h-4 w-full', local.class, local.className)}
            {...rest}
          />
        )}
      </For>
    </div>
  );
}

export { Skeleton, SkeletonList };

type SkeletonProps = JSX.IntrinsicElements['div'] & {
  className?: string;
};

type SkeletonListProps = SkeletonProps & {
  numberOfItems?: number;
};
