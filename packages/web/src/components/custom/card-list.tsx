import { cva, type VariantProps } from 'class-variance-authority';
import { PackageOpen } from 'lucide-solid';
import { For, Show, type JSX } from 'solid-js';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { Skeleton } from '../ui/skeleton';

const CardList = ({
  children,
  className,
  listClassName,
  ...props
}: JSX.IntrinsicElements['div'] & { listClassName?: string }) => {
  return (
    <ScrollArea
      class={`h-full overflow-auto ${className}`}
      viewPortClassName="[&>div]:h-full"
    >
      <div
        className={cn('flex flex-col h-full w-full', listClassName)}
        {...props}
      >
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
CardList.displayName = 'CardList';
export { CardList };

const cardItemListVariants = cva('flex items-center gap-3 w-full py-3 px-2 ', {
  variants: {
    interactive: {
      true: 'cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground',
      false: 'cursor-default text-accent-foreground/50 font-semibold',
    },
    selected: {
      true: 'bg-accent text-accent-foreground',
      false: '',
    },
  },
  defaultVariants: {
    interactive: true,
    selected: false,
  },
});

type CardListItemProps = JSX.IntrinsicElements['div'] &
  VariantProps<typeof cardItemListVariants> & {
    children: any;
  };

const CardListItem = ({
  children,
  onClick,
  className,
  interactive,
  selected,
  ...props
}: CardListItemProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(cardItemListVariants({ interactive, selected }), className)}
      {...props}
    >
      {children}
    </div>
  );
};

CardListItem.displayName = 'CardListItem';
export { CardListItem };

type CardListItemSkeletonProps = {
  numberOfCards?: number;
  withCircle?: boolean;
};

const CardListItemSkeleton = ({
  numberOfCards = 3,
  withCircle = true,
}: CardListItemSkeletonProps) => {
  return (
    <>
      <For each={[...Array(numberOfCards)].map((_, i) => i)}>
        {(index) => (
          <div className="flex items-center gap-3 w-full py-3 px-5">
            <Show when={withCircle}>
              <Skeleton class="h-8 w-8 rounded-full" />
            </Show>
            <div className="space-y-2">
              <Skeleton class="h-4 w-[250px]" />
              <Skeleton class="h-4 w-[200px]" />
            </div>
          </div>
        )}
      </For>
    </>
  );
};

CardListItemSkeleton.displayName = 'CardListItemSkeleton';
export { CardListItemSkeleton };

type CardListEmptyProps = {
  message: string;
};
const CardListEmpty = ({ message }: CardListEmptyProps) => {
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 flex-col text-muted-foreground">
      <PackageOpen class="w-10 h-10" />
      <div className="text-center tracking-tight">{message}</div>
    </div>
  );
};

CardListEmpty.displayName = 'CardListEmpty';
export { CardListEmpty };
