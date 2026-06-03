import * as CheckboxPrimitive from '@kobalte/core/checkbox';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckIcon, MinusIcon } from 'lucide-solid';
import { splitProps, type ComponentProps, Show } from 'solid-js';

import { cn } from '@/lib/utils';

const checkboxVariants = cva(
  'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      variant: {
        primary:
          'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:border-primary',
        secondary:
          'data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground dark:data-[state=checked]:bg-secondary data-[state=checked]:border-secondary data-[state=indeterminate]:bg-secondary data-[state=indeterminate]:text-secondary-foreground data-[state=indeterminate]:border-secondary',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

function Checkbox(_props: CheckboxProps) {
  const [local, rest] = splitProps(_props, ['className', 'variant', 'checked']);
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={local.checked}
      class={cn(checkboxVariants({ variant: local.variant }), local.className)}
      {...rest}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        class="grid place-content-center text-current transition-none"
      >
        <Show
          when={local.checked === 'indeterminate'}
          fallback={<CheckIcon class="size-3.5 text-current" />}
        >
          <MinusIcon class="size-3.5 text-current" />
        </Show>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, checkboxVariants };

type CheckboxProps = Omit<
  ComponentProps<typeof CheckboxPrimitive.Root>,
  'checked' | 'className'
> &
  VariantProps<typeof checkboxVariants> & {
    checked?: boolean | 'indeterminate';
    className?: string;
  };

export type { CheckboxProps };
