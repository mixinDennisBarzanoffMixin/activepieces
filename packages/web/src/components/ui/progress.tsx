import * as ProgressPrimitive from '@kobalte/core/progress';

import { cn } from '@/lib/utils';

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      class={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        class={cn(
          'h-full w-full flex-1 bg-primary transition-all',
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
};
