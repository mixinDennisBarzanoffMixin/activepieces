import * as TogglePrimitive from '@kobalte/core/toggle-button';
import { cva, type VariantProps } from 'class-variance-authority';
import { splitProps, type ComponentProps } from 'solid-js';

import { cn } from '@/lib/utils';

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 min-w-9 px-2',
        sm: 'h-7.5 px-2',
        lg: 'h-10 min-w-10 px-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle(props: ToggleProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'variant',
    'size',
  ]);

  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      class={cn(
        toggleVariants({
          variant: local.variant,
          size: local.size,
          className: cn(local.class, local.className),
        }),
      )}
      {...rest}
    />
  );
}

export { Toggle, toggleVariants };

type ToggleProps = Omit<ComponentProps<typeof TogglePrimitive.Root>, 'class'> &
  VariantProps<typeof toggleVariants> & {
    class?: string;
    className?: string;
  };
