import * as SwitchPrimitive from '@kobalte/core/switch';
import { Show, createSignal, splitProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

function Switch(props: SwitchProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'checkedIcon',
    'uncheckedIcon',
    'onCheckedChange',
    'variant',
    'size',
    'color',
    'checked',
    'defaultChecked',
  ]);
  const isControlled = () => local.checked !== undefined;
  const variant = () => local.variant ?? 'default';
  const size = () => local.size ?? 'default';
  const color = () => local.color ?? 'default';

  const [internalChecked, setInternalChecked] = createSignal(
    local.defaultChecked ?? false,
  );
  const isChecked = () =>
    isControlled() ? Boolean(local.checked) : internalChecked();

  const icon = () =>
    isChecked() ? local.checkedIcon : local.uncheckedIcon || local.checkedIcon;

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      class={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        COLOR_CLASSES[color()],
        variant() === 'square' ? 'rounded-md' : 'rounded-full',
        SIZE_CLASSES[size()],
        local.class,
        local.className,
      )}
      onCheckedChange={(checked: boolean) =>
        handleCheckedChange({
          checked,
          controlled: isControlled(),
          set: setInternalChecked,
          change: local.onCheckedChange,
        })
      }
      {...rest}
      checked={isChecked()}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        class={cn(
          'pointer-events-none flex items-center justify-center bg-background dark:bg-foreground shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0',
          variant() === 'square' ? 'rounded-sm' : 'rounded-full',
          THUMB_SIZE_CLASSES[size()],
        )}
      >
        <Show when={icon()}>
          <span class="flex items-center justify-center">{icon()}</span>
        </Show>
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

// Constants

const SIZE_CLASSES: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'h-4 w-8',
  default: 'h-5 w-10',
  lg: 'h-7 w-14',
  xl: 'h-8 w-16',
};

const THUMB_SIZE_CLASSES: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'h-3 w-3 data-[state=checked]:translate-x-4',
  default: 'h-4 w-4 data-[state=checked]:translate-x-5',
  lg: 'h-5 w-5 data-[state=checked]:translate-x-6',
  xl: 'h-6 w-6 data-[state=checked]:translate-x-7',
};

const COLOR_CLASSES: Record<NonNullable<SwitchProps['color']>, string> = {
  default: 'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
  secondary:
    'data-[state=checked]:bg-secondary data-[state=unchecked]:bg-input',
};

// Helper functions

function handleCheckedChange(opts: {
  checked: boolean;
  controlled: boolean;
  set: (value: boolean) => void;
  change?: (checked: boolean) => void;
}) {
  if (!opts.controlled) {
    opts.set(opts.checked);
  }
  if (opts.change) {
    opts.change(opts.checked);
  }
}

// Type definitions

type SwitchProps = Omit<JSX.IntrinsicElements['div'], 'onChange'> & {
  class?: string;
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  checkedIcon?: JSX.Element;
  uncheckedIcon?: JSX.Element;
  variant?: 'default' | 'square';
  size?: 'default' | 'sm' | 'lg' | 'xl';
  color?: 'default' | 'secondary';
};

export { Switch };
export type { SwitchProps };
