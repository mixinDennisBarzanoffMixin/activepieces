import * as RadioGroupPrimitive from '@kobalte/core/radio-group';
import { CircleIcon } from 'lucide-solid';
import { splitProps, type ComponentProps } from 'solid-js';

import { cn } from '@/lib/utils';

function RadioGroup(props: RadioGroupProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      class={cn('grid gap-3', local.class, local.className)}
      {...rest}
    />
  );
}

function RadioGroupItem(props: RadioGroupItemProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      class={cn(
        'aspect-square size-4 shrink-0 rounded-full border border-input text-primary shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
        local.class,
        local.className,
      )}
      {...rest}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        class="relative flex items-center justify-center"
      >
        <CircleIcon class="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };

type RadioGroupProps = Omit<
  ComponentProps<typeof RadioGroupPrimitive.Root>,
  'class'
> & {
  class?: string;
  className?: string;
};

type RadioGroupItemProps = Omit<
  ComponentProps<typeof RadioGroupPrimitive.Item>,
  'class'
> & {
  class?: string;
  className?: string;
};
