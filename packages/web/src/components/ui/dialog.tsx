import * as DialogPrimitive from '@kobalte/core/dialog';
import { XIcon } from 'lucide-solid';
import { Show, splitProps, type ComponentProps, type JSX } from 'solid-js';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  const [local, rest] = splitProps(props, ['children']);
  return (
    <DialogPrimitive.Root data-slot="dialog" {...rest}>
      {local.children}
    </DialogPrimitive.Root>
  );
}

function DialogTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props: ComponentProps<typeof DialogPrimitive.Portal>) {
  const [local, rest] = splitProps(props, ['children']);
  return (
    <DialogPrimitive.Portal data-slot="dialog-portal" {...rest}>
      {local.children}
    </DialogPrimitive.Portal>
  );
}

function DialogClose(
  props: ComponentProps<typeof DialogPrimitive.CloseButton>,
) {
  return <DialogPrimitive.CloseButton data-slot="dialog-close" {...props} />;
}

function DialogOverlay(
  props: ClassNameProps<ComponentProps<typeof DialogPrimitive.Overlay>>,
) {
  const [local, rest] = splitProps(props, ['className']);
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      tabIndex={-1}
      class={cn(
        'fixed inset-0 z-50 bg-black/80 outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        local.className,
      )}
      {...rest}
    />
  );
}

function DialogContent(props: DialogContentProps) {
  const [local, rest] = splitProps(props, [
    'className',
    'children',
    'showCloseButton',
    'showOverlay',
  ]);
  return (
    <>
      <Show when={local.showOverlay ?? true}>
        <DialogOverlay />
      </Show>
      <DialogPrimitive.Content
        data-slot="dialog-content"
        class={cn(
          'fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-5 shadow-lg duration-200 outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          local.className,
        )}
        {...rest}
      >
        {local.children}
        <Show when={local.showCloseButton ?? true}>
          <DialogPrimitive.CloseButton
            data-slot="dialog-close"
            class="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span class="sr-only">Close</span>
          </DialogPrimitive.CloseButton>
        </Show>
      </DialogPrimitive.Content>
    </>
  );
}

function DialogHeader(props: ClassNameProps<JSX.IntrinsicElements['div']>) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="dialog-header"
      class={cn(
        'flex flex-col gap-2 text-center sm:text-left mb-3',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function DialogFooter(props: DialogFooterProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'showCloseButton',
    'children',
  ]);
  return (
    <div
      data-slot="dialog-footer"
      class={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-3',
        local.class,
        local.className,
      )}
      {...rest}
    >
      {local.children}
      <Show when={local.showCloseButton}>
        <DialogPrimitive.CloseButton
          class={cn(buttonVariants({ variant: 'outline' }))}
        >
          Close
        </DialogPrimitive.CloseButton>
      </Show>
    </div>
  );
}

function DialogTitle(
  props: ClassNameProps<ComponentProps<typeof DialogPrimitive.Title>>,
) {
  const [local, rest] = splitProps(props, ['className']);
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      class={cn(
        'text-lg leading-none font-semibold tracking-tight',
        local.className,
      )}
      {...rest}
    />
  );
}

function DialogDescription(
  props: ClassNameProps<ComponentProps<typeof DialogPrimitive.Description>>,
) {
  const [local, rest] = splitProps(props, ['className']);
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      class={cn('text-sm text-muted-foreground', local.className)}
      {...rest}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

type DialogContentProps = {
  showCloseButton?: boolean;
  showOverlay?: boolean;
} & ClassNameProps<ComponentProps<typeof DialogPrimitive.Content>>;

type DialogFooterProps = ClassNameProps<JSX.IntrinsicElements['div']> & {
  showCloseButton?: boolean;
};

type ClassNameProps<T> = Omit<T, 'className'> & {
  className?: string;
};
