import * as DrawerPrimitive from '@corvu/drawer';
import { Show, createEffect } from 'solid-js';

import { cn } from '@/lib/utils';

function Drawer({
  onOpenChange,
  open,
  closeOnEscape = true,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Root> & {
  closeOnEscape?: boolean;
}) {
  createEffect(() => {
    if (!open || !onOpenChange || !closeOnEscape) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      open={open}
      onOpenChange={onOpenChange}
      {...props}
    />
  );
}

function DrawerTrigger({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      class={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  fullscreen = false,
  ...props
}: DrawerContentProps) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <Show when={fullscreen}>
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
          fullscreen && 'w-screen max-w-none',
          className,
        )}
        {...props}
      >
        {!fullscreen && (
          <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: JSX.IntrinsicElements['div']) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'flex flex-col border border-b gap-0.5 p-0 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left',
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: JSX.IntrinsicElements['div']) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Label>) {
  return (
    <DrawerPrimitive.Label
      data-slot="drawer-title"
      class={cn('text-foreground font-semibold', className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      class={cn('text-muted-foreground text-sm', className)}
      {...props}
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

type DrawerContentProps = ComponentProps<typeof DrawerPrimitive.Content> & {
  fullscreen?: boolean;
};
