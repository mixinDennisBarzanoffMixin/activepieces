import { cva, type VariantProps } from 'class-variance-authority';

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

interface DotProps extends VariantProps<typeof dotVariants>, any {
  animation?: boolean;
}

const Dot = ({ className, animation = false, variant, ...props }: DotProps) => {
  return (
    <div
      className={cn(
        dotVariants({ variant }),
        animation && 'animate-pulse',
        className,
      )}
      {...props}
    />
  );
};

Dot.displayName = 'Dot';

export { Dot };
