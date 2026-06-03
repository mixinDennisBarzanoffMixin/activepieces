import { cva, type VariantProps } from 'class-variance-authority';
import { PackageOpen } from 'lucide-solid';
import { For, mergeProps, Show, splitProps, type JSX } from 'solid-js';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { Skeleton } from '../ui/skeleton';

const CardList = (_props: ClassName<JSX.IntrinsicElements['div']>) => {
  const [local, props] = splitProps(_props, [
    'children',
    'className',
    'listClassName',
  ]);
  return (
    <ScrollArea
      class={cn('h-full overflow-auto', local.className)}
      viewPortClassName="[&>div]:h-full"
    >
      <div
        class={cn('flex flex-col h-full w-full', local.listClassName)}
        {...props}
      >
        {local.children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
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
    children: JSX.Element;
    className?: string;
  };

const CardListItem = (_props: CardListItemProps) => {
  const [local, props] = splitProps(_props, [
    'children',
    'onClick',
    'className',
    'interactive',
    'selected',
  ]);
  return (
    <div
      onClick={(e) => {
        local.onClick?.(e);
      }}
      class={cn(
        cardItemListVariants({
          interactive: local.interactive,
          selected: local.selected,
        }),
        local.className,
      )}
      {...props}
    >
      {local.children}
    </div>
  );
};

export { CardListItem };

type CardListItemSkeletonProps = {
  numberOfCards?: number;
  withCircle?: boolean;
};

const CardListItemSkeleton = (_props: CardListItemSkeletonProps) => {
  const props = mergeProps({ numberOfCards: 3, withCircle: true }, _props);
  return (
    <>
      <For each={Array.from({ length: props.numberOfCards })}>
        {() => (
          <div class="flex items-center gap-3 w-full py-3 px-5">
            <Show when={props.withCircle}>
              <Skeleton class="h-8 w-8 rounded-full" />
            </Show>
            <div class="space-y-2">
              <Skeleton class="h-4 w-[250px]" />
              <Skeleton class="h-4 w-[200px]" />
            </div>
          </div>
        )}
      </For>
    </>
  );
};

export { CardListItemSkeleton };

type CardListEmptyProps = {
  message: string;
};
const CardListEmpty = (props: CardListEmptyProps) => {
  return (
    <div class="flex h-full w-full items-center justify-center gap-3 flex-col text-muted-foreground">
      <PackageOpen class="w-10 h-10" />
      <div class="text-center tracking-tight">{props.message}</div>
    </div>
  );
};

export { CardListEmpty };

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
  listClassName?: string;
};
