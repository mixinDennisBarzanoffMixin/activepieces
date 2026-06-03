import * as HoverCardPrimitive from '@kobalte/core/hover-card';
import { mergeProps, splitProps, type ComponentProps } from 'solid-js';

import { cn } from '@/lib/utils';

function HoverCard(_props: ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {..._props} />;
}

function HoverCardTrigger(
  _props: ComponentProps<typeof HoverCardPrimitive.Trigger>,
) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {..._props} />
  );
}

function HoverCardContent(_props: HoverCardContentProps) {
  const props = mergeProps({ align: 'center', sideOffset: 4 }, _props);
  const [local, rest] = splitProps(props, ['className', 'align', 'sideOffset']);
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={local.align}
        sideOffset={local.sideOffset}
        class={cn(
          'z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          local.className,
        )}
        {...rest}
      />
    </HoverCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

type HoverCardContentProps = ClassName<
  Omit<
    ComponentProps<typeof HoverCardPrimitive.Content>,
    'align' | 'sideOffset'
  >
> & {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
};
