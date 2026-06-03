import { cva, type VariantProps } from 'class-variance-authority';
import { JSX, mergeProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

const dotVariants = cva('size-2 rounded-full', {
  variants: {
    variant: {
      destructive: 'bg-destructive',
      primary: 'bg-primary',
    },
  },
  defaultVariants: {},
});

type DotProps = ClassName<JSX.HTMLAttributes<HTMLDivElement>> &
  VariantProps<typeof dotVariants> & {
    animation?: boolean;
  };

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

const Dot = (_props: DotProps) => {
  const merged = mergeProps({ animation: false }, _props);
  const [local, props] = splitProps(merged, [
    'className',
    'animation',
    'variant',
  ]);
  return (
    <div
      class={cn(
        dotVariants({ variant: local.variant }),
        local.animation && 'animate-pulse',
        local.className,
      )}
      {...props}
    />
  );
};

export { Dot };
