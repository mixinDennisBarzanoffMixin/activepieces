import { ChevronDown, Circle } from 'lucide-solid';
import { JSX } from 'solid-js';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type ChainOfThoughtItemProps = ComponentProps<'div'>;

export const ChainOfThoughtItem = ({
  children,
  className,
  ...props
}: ChainOfThoughtItemProps) => (
  <div className={cn('text-muted-foreground text-sm', className)} {...props}>
    {children}
  </div>
);

export type ChainOfThoughtTriggerProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  leftIcon?: JSX.Element;
  swapIconOnHover?: boolean;
};

export const ChainOfThoughtTrigger = ({
  children,
  className,
  leftIcon,
  swapIconOnHover = true,
  ...props
}: ChainOfThoughtTriggerProps) => (
  <CollapsibleTrigger
    class={cn(
      'group text-muted-foreground hover:text-foreground flex cursor-pointer items-center justify-start gap-1 text-left text-sm transition-colors',
      className,
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      {leftIcon ? (
        <span className="relative inline-flex size-4 items-center justify-center">
          <span
            className={cn(
              'transition-opacity',
              swapIconOnHover && 'group-hover:opacity-0',
            )}
          >
            {leftIcon}
          </span>
          {swapIconOnHover && (
            <ChevronDown class="absolute size-4 opacity-0 transition-opacity group-hover:opacity-100 group-data-[state=open]:rotate-180" />
          )}
        </span>
      ) : (
        <span className="relative inline-flex size-4 items-center justify-center">
          <Circle class="size-2 fill-current" />
        </span>
      )}
      <span>{children}</span>
    </div>
    {!leftIcon && (
      <ChevronDown class="size-4 transition-transform group-data-[state=open]:rotate-180" />
    )}
  </CollapsibleTrigger>
);

export type ChainOfThoughtContentProps = ComponentProps<
  typeof CollapsibleContent
>;

export const ChainOfThoughtContent = ({
  children,
  className,
  ...props
}: ChainOfThoughtContentProps) => {
  return (
    <CollapsibleContent
      class={cn(
        'text-popover-foreground data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden',
        className,
      )}
      {...props}
    >
      <div className="grid grid-cols-[min-content_minmax(0,1fr)] gap-x-4">
        <div className="bg-primary/20 ml-1.75 h-full w-px group-data-[last=true]:hidden" />
        <div className="ml-1.75 h-full w-px bg-transparent group-data-[last=false]:hidden" />
        <div className="mt-2 space-y-2">{children}</div>
      </div>
    </CollapsibleContent>
  );
};

export type ChainOfThoughtProps = {
  children: JSX.Element;
  className?: string;
};

export function ChainOfThought({ children, className }: ChainOfThoughtProps) {
  const childrenArray = toArray(children);

  return (
    <div className={cn('space-y-0', className)}>
      {childrenArray.map((child, index) => (
        <Fragment key={index}>
          {isValidElement(child) &&
            cloneElement(child as JSX.Element<ChainOfThoughtStepProps>, {
              isLast: index === childrenArray.length - 1,
            })}
        </Fragment>
      ))}
    </div>
  );
}

export type ChainOfThoughtStepProps = {
  children: JSX.Element;
  className?: string;
  isLast?: boolean;
};

export const ChainOfThoughtStep = ({
  children,
  className,
  isLast = false,
  ...props
}: ChainOfThoughtStepProps & ComponentProps<typeof Collapsible>) => {
  return (
    <Collapsible class={cn('group', className)} data-last={isLast} {...props}>
      {children}
      <div className="flex justify-start group-data-[last=true]:hidden">
        <div className="bg-primary/20 ml-1.75 h-4 w-px" />
      </div>
    </Collapsible>
  );
};
