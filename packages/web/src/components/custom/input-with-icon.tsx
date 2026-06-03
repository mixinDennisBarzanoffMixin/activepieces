import { splitProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

const inputClass =
  'grow flex h-9 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-hidden focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 box-border';

const InputWithIcon = (props: InputWithIconProps) => {
  const split = splitProps(props, ['icon', 'className', 'disabled', 'ref']);
  const local = split[0];
  const rest = split[1];

  return (
    <div class={cn(inputClass, local.className, 'items-center gap-2')}>
      {local.icon}
      <input
        ref={(el) => {
          local.ref?.(el);
        }}
        class={cn(
          'flex h-full w-full rounded-md bg-transparent text-sm outline-hidden placeholder:text-muted-foreground',
          { 'cursor-not-allowed opacity-50': local.disabled },
        )}
        disabled={local.disabled}
        {...rest}
      />
    </div>
  );
};

export { InputWithIcon };

type InputWithIconProps = Omit<
  JSX.IntrinsicElements['input'],
  'className' | 'disabled' | 'ref'
> & {
  className?: string;
  disabled?: boolean;
  icon: JSX.Element;
  ref?: (el: HTMLInputElement) => void;
};
