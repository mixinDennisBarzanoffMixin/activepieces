import * as ResizablePrimitive from '@corvu/resizable';
import { GripVerticalIcon } from 'lucide-solid';
import { Show, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

function ResizablePanelGroup(props: ResizablePanelGroupProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <ResizablePrimitive.Root
      data-slot="resizable-panel-group"
      class={cn(
        'flex h-full w-full aria-[orientation=vertical]:flex-col',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function ResizablePanel(props: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle(props: ResizableHandleProps) {
  const [local, rest] = splitProps(props, ['withHandle', 'class', 'className']);
  return (
    <ResizablePrimitive.Handle
      data-slot="resizable-handle"
      class={cn(
        'bg-border z-40 relative flex w-px items-center justify-center outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90',
        local.class,
        local.className,
      )}
      {...rest}
    >
      <Show when={local.withHandle}>
        <div class="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border">
          <GripVerticalIcon class="size-2.5 hover:fill-primary" />
        </div>
      </Show>
    </ResizablePrimitive.Handle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };

type ResizablePanelGroupProps = Omit<ResizablePrimitive.RootProps, 'class'> & {
  class?: string;
  className?: string;
};

type ResizableHandleProps = Omit<ResizablePrimitive.HandleProps, 'class'> & {
  class?: string;
  className?: string;
  withHandle?: boolean;
};
