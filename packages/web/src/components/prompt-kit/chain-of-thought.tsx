import { ChevronDown, Circle } from 'lucide-solid';
import { JSX, mergeProps, splitProps, Show } from 'solid-js';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type ChainOfThoughtItemProps = {
  children?: JSX.Element;
  className?: string;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'className'>;

export const ChainOfThoughtItem = (_props: ChainOfThoughtItemProps) => {
  const [local, props] = splitProps(_props, ['children', 'className']);
  return (
    <div
      class={cn('text-muted-foreground text-sm', local.className)}
      {...props}
    >
      {local.children}
    </div>
  );
};

export type ChainOfThoughtTriggerProps = {
  children?: JSX.Element;
  className?: string;
  leftIcon?: JSX.Element;
  swapIconOnHover?: boolean;
} & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>;

export const ChainOfThoughtTrigger = (_props: ChainOfThoughtTriggerProps) => {
  const [local, props] = splitProps(
    mergeProps({ swapIconOnHover: true }, _props),
    ['children', 'className', 'leftIcon', 'swapIconOnHover'],
  );
  return (
    <CollapsibleTrigger
      class={cn(
        'group text-muted-foreground hover:text-foreground flex cursor-pointer items-center justify-start gap-1 text-left text-sm transition-colors',
        local.className,
      )}
      {...props}
    >
      <div class="flex items-center gap-2">
        <Show
          when={local.leftIcon}
          fallback={
            <span class="relative inline-flex size-4 items-center justify-center">
              <Circle class="size-2 fill-current" />
            </span>
          }
        >
          <span class="relative inline-flex size-4 items-center justify-center">
            <span
              class={cn(
                'transition-opacity',
                local.swapIconOnHover && 'group-hover:opacity-0',
              )}
            >
              {local.leftIcon}
            </span>
            <Show when={local.swapIconOnHover}>
              <ChevronDown class="absolute size-4 opacity-0 transition-opacity group-hover:opacity-100 group-data-[state=open]:rotate-180" />
            </Show>
          </span>
        </Show>
        <span>{local.children}</span>
      </div>
      <Show when={!local.leftIcon}>
        <ChevronDown class="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </Show>
    </CollapsibleTrigger>
  );
};

export type ChainOfThoughtContentProps = {
  children?: JSX.Element;
  className?: string;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'className'>;

export const ChainOfThoughtContent = (_props: ChainOfThoughtContentProps) => {
  const [local, props] = splitProps(_props, ['children', 'className']);
  return (
    <CollapsibleContent
      class={cn(
        'text-popover-foreground data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden',
        local.className,
      )}
      {...props}
    >
      <div class="grid grid-cols-[min-content_minmax(0,1fr)] gap-x-4">
        <div class="bg-primary/20 ml-1.75 h-full w-px group-data-[last=true]:hidden" />
        <div class="ml-1.75 h-full w-px bg-transparent group-data-[last=false]:hidden" />
        <div class="mt-2 space-y-2">{local.children}</div>
      </div>
    </CollapsibleContent>
  );
};

export type ChainOfThoughtProps = {
  children: JSX.Element;
  className?: string;
};

export function ChainOfThought(props: ChainOfThoughtProps) {
  return <div class={cn('space-y-0', props.className)}>{props.children}</div>;
}

export type ChainOfThoughtStepProps = {
  children: JSX.Element;
  className?: string;
  isLast?: boolean;
};

type ChainOfThoughtStepRootProps = ChainOfThoughtStepProps &
  Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'className'>;

export const ChainOfThoughtStep = (_props: ChainOfThoughtStepRootProps) => {
  const [local, props] = splitProps(mergeProps({ isLast: false }, _props), [
    'children',
    'className',
    'isLast',
  ]);
  return (
    <Collapsible
      class={cn('group', local.className)}
      data-last={local.isLast}
      {...props}
    >
      {local.children}
      <div class="flex justify-start group-data-[last=true]:hidden">
        <div class="bg-primary/20 ml-1.75 h-4 w-px" />
      </div>
    </Collapsible>
  );
};
