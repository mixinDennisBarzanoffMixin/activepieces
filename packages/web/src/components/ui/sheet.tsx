import * as SheetPrimitive from '@kobalte/core/dialog';
import { XIcon } from 'lucide-solid';
import { splitProps, type ComponentProps, type JSX, Show } from 'solid-js';

import { cn } from '@/lib/utils';

function Sheet(props: ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: ComponentProps<typeof SheetPrimitive.CloseButton>) {
  return <SheetPrimitive.CloseButton data-slot="sheet-close" {...props} />;
}

function SheetPortal(props: ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay(props: SheetOverlayProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      class={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SheetContent(props: SheetContentProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'children',
    'side',
    'hideCloseButton',
  ]);
  const side = () => local.side ?? 'right';
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        class={cn(
          'fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500',
          side() === 'right' &&
            'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
          side() === 'left' &&
            'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
          side() === 'top' &&
            'inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
          side() === 'bottom' &&
            'inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          local.class,
          local.className,
        )}
        {...rest}
      >
        {local.children}
        <Show when={!(local.hideCloseButton ?? false)}>
          <SheetPrimitive.CloseButton class="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-secondary">
            <XIcon class="size-4" />
            <span class="sr-only">Close</span>
          </SheetPrimitive.CloseButton>
        </Show>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader(props: SheetDivProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="sheet-header"
      class={cn('flex flex-col gap-1.5 p-4', local.class, local.className)}
      {...rest}
    />
  );
}

function SheetFooter(props: SheetDivProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="sheet-footer"
      class={cn(
        'mt-auto flex flex-col gap-2 p-4',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SheetTitle(props: SheetTitleProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      class={cn('font-semibold text-foreground', local.class, local.className)}
      {...rest}
    />
  );
}

function SheetDescription(props: SheetDescriptionProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      class={cn('text-sm text-muted-foreground', local.class, local.className)}
      {...rest}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};

type SheetOverlayProps = Omit<
  ComponentProps<typeof SheetPrimitive.Overlay>,
  'class'
> & {
  class?: string;
  className?: string;
};

type SheetContentProps = Omit<
  ComponentProps<typeof SheetPrimitive.Content>,
  'class'
> & {
  class?: string;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  hideCloseButton?: boolean;
};

type SheetDivProps = JSX.IntrinsicElements['div'] & {
  className?: string;
};

type SheetTitleProps = Omit<
  ComponentProps<typeof SheetPrimitive.Title>,
  'class'
> & {
  class?: string;
  className?: string;
};

type SheetDescriptionProps = Omit<
  ComponentProps<typeof SheetPrimitive.Description>,
  'class'
> & {
  class?: string;
  className?: string;
};
