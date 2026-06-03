import { cva, type VariantProps } from 'class-variance-authority';
import { splitProps, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { Slot } from '@/components/ui/slot';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-1.5 py-px text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive-50 text-destructive-700 border-destructive-600 dark:bg-destructive-950 dark:text-destructive-300 dark:border-destructive-400',
        success:
          'bg-success-50 text-success-700 border-success-600 dark:bg-success-950 dark:text-success-300 dark:border-success-400',
        accent: 'bg-accent text-accent-foreground border-border',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge(props: BadgeProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'variant',
    'asChild',
  ]);
  const variant = () => local.variant ?? 'default';
  const Comp = () => (local.asChild ? Slot.Root : 'span');

  return (
    <Dynamic
      component={Comp()}
      data-slot="badge"
      data-variant={variant()}
      class={cn(
        badgeVariants({ variant: variant() }),
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

export { Badge, badgeVariants };

type BadgeProps = JSX.IntrinsicElements['span'] &
  VariantProps<typeof badgeVariants> & {
    className?: string;
    asChild?: boolean;
  };
