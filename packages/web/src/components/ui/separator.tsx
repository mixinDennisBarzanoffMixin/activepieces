import * as SeparatorPrimitive from '@kobalte/core/separator';
import { splitProps, type ComponentProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

function Separator(props: SeparatorProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'orientation',
    'decorative',
  ]);
  const orientation = () => local.orientation ?? 'horizontal';

  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={local.decorative ?? true}
      orientation={orientation()}
      class={cn(
        'shrink-0 bg-border',
        orientation() === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function HorizontalSeparatorWithText(props: HorizontalSeparatorWithTextProps) {
  return (
    <div
      class={cn(
        'flex w-full flex-row items-center',
        props.class,
        props.className,
      )}
    >
      <div class="w-1/2 border" />
      <span class="mx-2 text-sm">{props.children}</span>
      <div class="w-1/2 border" />
    </div>
  );
}

export { Separator, HorizontalSeparatorWithText };

type SeparatorProps = Omit<
  ComponentProps<typeof SeparatorPrimitive.Root>,
  'class' | 'orientation' | 'decorative'
> & {
  class?: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
};

type HorizontalSeparatorWithTextProps = {
  class?: string;
  className?: string;
  children: JSX.Element;
};
