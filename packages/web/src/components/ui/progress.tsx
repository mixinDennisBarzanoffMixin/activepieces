import * as ProgressPrimitive from '@kobalte/core/progress';
import { splitProps, type ComponentProps } from 'solid-js';

import { cn } from '@/lib/utils';

function Progress(props: ProgressProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'value',
    'indicatorClassName',
  ]);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      class={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
        local.class,
        local.className,
      )}
      {...rest}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        class={cn(
          'h-full w-full flex-1 bg-primary transition-all',
          local.indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - (local.value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

type ProgressProps = Omit<
  ComponentProps<typeof ProgressPrimitive.Root>,
  'class'
> & {
  class?: string;
  className?: string;
  indicatorClassName?: string;
};
