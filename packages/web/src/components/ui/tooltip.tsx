import * as TooltipPrimitive from '@kobalte/core/tooltip';
import { splitProps, type ComponentProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

function TooltipProvider(props: { children?: JSX.Element }) {
  return <>{props.children}</>;
}

function Tooltip(props: ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger(
  props: ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent(props: TooltipContentProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'sideOffset',
    'children',
  ]);

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={local.sideOffset ?? 0}
        class={cn(
          'z-50 w-fit origin-(--radix-tooltip-content-transform-origin) animate-in rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          local.class,
          local.className,
        )}
        {...rest}
      >
        {local.children}
        <TooltipPrimitive.Arrow class="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

type TooltipContentProps = Omit<
  ComponentProps<typeof TooltipPrimitive.Content>,
  'class' | 'sideOffset'
> & {
  class?: string;
  className?: string;
  sideOffset?: number;
};
