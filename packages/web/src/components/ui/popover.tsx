import { createContext, createSignal, Show, useContext } from 'solid-js';

import { cn } from '@/lib/utils';

type PopoverState = {
  open: () => boolean;
  setOpen: (open: boolean) => void;
};

const PopoverContext = createContext<PopoverState>();

function Popover(props: JSX.IntrinsicElements['div'] & {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, set] = createSignal(!!props.defaultOpen);
  const state = {
    open: () => props.open ?? open(),
    setOpen: (value: boolean) => {
      set(value);
      props.onOpenChange?.(value);
    },
  };

  return (
    <PopoverContext.Provider value={state}>
      <div data-slot="popover" class={props.class} className={props.className}>
        {props.children}
      </div>
    </PopoverContext.Provider>
  );
}

function usePopover() {
  const state = useContext(PopoverContext);
  if (!state) {
    throw new Error('Popover components must be used within Popover');
  }
  return state;
}

function PopoverTrigger(props: JSX.IntrinsicElements['button'] & { asChild?: boolean }) {
  const state = usePopover();
  const click = (event: MouseEvent) => {
    props.onClick?.(event);
    if (!event.defaultPrevented) {
      state.setOpen(!state.open());
    }
  };

  if (props.asChild) {
    return (
      <span data-slot="popover-trigger" onClick={click}>
        {props.children}
      </span>
    );
  }

  return (
    <button data-slot="popover-trigger" {...props} onClick={click}>
      {props.children}
    </button>
  );
}

function PopoverContent(props: JSX.IntrinsicElements['div'] & {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  onOpenAutoFocus?: (event: Event) => void;
}) {
  const state = usePopover();
  const side = () => props.side ?? 'bottom';
  const align = () => props.align ?? 'center';
  const offset = () => `${props.sideOffset ?? 4}px`;

  return (
    <Show when={state.open()}>
      <div
        data-slot="popover-content"
        class={cn(
          'absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden',
          side() === 'bottom' && 'top-full',
          side() === 'top' && 'bottom-full',
          side() === 'right' && 'left-full top-1/2 -translate-y-1/2',
          side() === 'left' && 'right-full top-1/2 -translate-y-1/2',
          align() === 'start' && (side() === 'top' || side() === 'bottom') && 'left-0',
          align() === 'center' && (side() === 'top' || side() === 'bottom') && 'left-1/2 -translate-x-1/2',
          align() === 'end' && (side() === 'top' || side() === 'bottom') && 'right-0',
          props.class,
          props.className,
        )}
        style={{
          'margin-top': side() === 'bottom' ? offset() : undefined,
          'margin-bottom': side() === 'top' ? offset() : undefined,
          'margin-left': side() === 'right' ? offset() : undefined,
          'margin-right': side() === 'left' ? offset() : undefined,
          ...props.style,
        }}
      >
        {props.children}
      </div>
    </Show>
  );
}

function PopoverAnchor(props: JSX.IntrinsicElements['div'] & { asChild?: boolean }) {
  if (props.asChild) {
    return <>{props.children}</>;
  }
  return (
    <div data-slot="popover-anchor" {...props}>
      {props.children}
    </div>
  );
}

function PopoverHeader(props: JSX.IntrinsicElements['div']) {
  return (
    <div
      data-slot="popover-header"
      className={cn('flex flex-col gap-1 text-sm', props.class, props.className)}
      {...props}
    />
  );
}

function PopoverTitle(props: JSX.IntrinsicElements['h2']) {
  return (
    <div
      data-slot="popover-title"
      className={cn('font-medium', props.class, props.className)}
      {...props}
    />
  );
}

function PopoverDescription(props: JSX.IntrinsicElements['p']) {
  return (
    <p
      data-slot="popover-description"
      className={cn('text-muted-foreground', props.class, props.className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
};
