import * as DialogPrimitive from '@kobalte/core/dialog';
import { XIcon } from 'lucide-solid';
import { Show, splitProps } from 'solid-js';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  const [local, rest] = splitProps(props, ['children']);
  return (
    <DialogPrimitive.Root data-slot="dialog" {...rest}>
      {local.children}
    </DialogPrimitive.Root>
  );
}

function DialogTrigger({
  ...props
}: ComponentProps<typeof DialogPrimitive.Trigger>) {
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

function DialogClose({
  ...props
}: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      tabIndex={-1}
      class={cn(
        'fixed inset-0 z-50 bg-black/80 outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent(
  props: ComponentProps<typeof DialogPrimitive.Content> & DialogContentProps,
) {
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
        {(local.showCloseButton ?? true) && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            class="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </>
  );
}

function DialogHeader({ className, ...props }: JSX.IntrinsicElements['div']) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-2 text-center sm:text-left mb-3',
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter(props: JSX.IntrinsicElements['div'] & DialogFooterProps) {
  const [local, rest] = splitProps(props, [
    'className',
    'showCloseButton',
    'children',
  ]);
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-3',
        local.className,
      )}
      {...rest}
    >
      {local.children}
      <Show when={local.showCloseButton}>
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      </Show>
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      class={cn('text-lg leading-none font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      class={cn('text-sm text-muted-foreground', className)}
      {...props}
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
};

type DialogFooterProps = {
  showCloseButton?: boolean;
};
