import * as DrawerPrimitive from '@corvu/drawer';
import {
  Show,
  createEffect,
  mergeProps,
  splitProps,
  type ComponentProps,
  type JSX,
} from 'solid-js';

import { cn } from '@/lib/utils';

function Drawer(
  _props: ComponentProps<typeof DrawerPrimitive.Root> & {
    closeOnEscape?: boolean;
  },
) {
  const props = mergeProps({ closeOnEscape: true }, _props);
  const [local, rest] = splitProps(props, [
    'onOpenChange',
    'open',
    'closeOnEscape',
  ]);
  createEffect(() => {
    if (!local.open || !local.onOpenChange || !local.closeOnEscape) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && local.closeOnEscape) {
        local.onOpenChange(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      open={local.open}
      onOpenChange={local.onOpenChange}
      {...rest}
    />
  );
}

function DrawerTrigger(_props: ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {..._props} />;
}

function DrawerPortal(_props: ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {..._props} />;
}

function DrawerClose(_props: ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {..._props} />;
}

function DrawerOverlay(
  _props: ClassName<ComponentProps<typeof DrawerPrimitive.Overlay>>,
) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      class={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        local.className,
      )}
      {...rest}
    />
  );
}

function DrawerContent(_props: DrawerContentProps) {
  const props = mergeProps({ fullscreen: false }, _props);
  const [local, rest] = splitProps(props, [
    'className',
    'children',
    'fullscreen',
  ]);
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <Show when={local.fullscreen}>
        <style>
          {`
            [data-vaul-drawer][data-vaul-drawer-direction="right"]::after {
              display: none !important;
            }
          `}
        </style>
      </Show>
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        class={cn(
          'group/drawer-content bg-background fixed z-50 flex h-auto flex-col shadow-lg outline-hidden select-text',
          'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b',
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t',
          'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:shadow-[-10px_0_10px_-3px_rgba(0,0,0,0.1)]',
          'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:shadow-[10px_0_10px_-3px_rgba(0,0,0,0.1)]',
          local.fullscreen && 'w-screen max-w-none',
          local.className,
        )}
        {...rest}
      >
        <Show when={!local.fullscreen}>
          <div class="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        </Show>
        {local.children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="drawer-header"
      class={cn(
        'flex flex-col border border-b gap-0.5 p-0 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left',
        local.className,
      )}
      {...rest}
    />
  );
}

function DrawerFooter(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <div
      data-slot="drawer-footer"
      class={cn('mt-auto flex flex-col gap-2 p-4', local.className)}
      {...rest}
    />
  );
}

function DrawerTitle(
  _props: ClassName<ComponentProps<typeof DrawerPrimitive.Label>>,
) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <DrawerPrimitive.Label
      data-slot="drawer-title"
      class={cn('text-foreground font-semibold', local.className)}
      {...rest}
    />
  );
}

function DrawerDescription(
  _props: ClassName<ComponentProps<typeof DrawerPrimitive.Description>>,
) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      class={cn('text-muted-foreground text-sm', local.className)}
      {...rest}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};

type DrawerContentProps = ClassName<
  ComponentProps<typeof DrawerPrimitive.Content>
> & {
  fullscreen?: boolean;
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};
