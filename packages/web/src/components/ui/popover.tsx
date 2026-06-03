import {
  createContext,
  createSignal,
  Show,
  splitProps,
  useContext,
  type JSX,
} from 'solid-js';

import { cn } from '@/lib/utils';

type PopoverState = {
  open: () => boolean;
  setOpen: (open: boolean) => void;
};

const PopoverContext = createContext<PopoverState>();

function Popover(props: PopoverProps) {
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'defaultOpen',
    'open',
    'onOpenChange',
    'modal',
  ]);
  const [open, set] = createSignal(!!local.defaultOpen);
  const state = {
    open: () => local.open ?? open(),
    setOpen: (value: boolean) => {
      set(value);
      local.onOpenChange?.(value);
    },
  };

  return (
    <PopoverContext.Provider value={state}>
      <div
        data-slot="popover"
        class={cn(local.class, local.className)}
        {...rest}
      >
        {local.children}
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

function PopoverTrigger(
  props: JSX.IntrinsicElements['button'] & { asChild?: boolean },
) {
  const [local, rest] = splitProps(props, ['asChild', 'children', 'onClick']);
  const state = usePopover();
  const click = (event: MouseEvent) => {
    local.onClick?.(event);
    if (!event.defaultPrevented) {
      state.setOpen(!state.open());
    }
  };

  return (
    <Show
      when={local.asChild}
      fallback={
        <button data-slot="popover-trigger" {...rest} onClick={click}>
          {local.children}
        </button>
      }
    >
      <span data-slot="popover-trigger" onClick={click}>
        {local.children}
      </span>
    </Show>
  );
}

function PopoverContent(props: PopoverContentProps) {
  const [local, rest] = splitProps(props, [
    'align',
    'children',
    'class',
    'className',
    'side',
    'sideOffset',
    'style',
    'onOpenAutoFocus',
  ]);
  const state = usePopover();
  const side = () => local.side ?? 'bottom';
  const align = () => local.align ?? 'center';
  const offset = () => `${local.sideOffset ?? 4}px`;

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
          align() === 'start' &&
            (side() === 'top' || side() === 'bottom') &&
            'left-0',
          align() === 'center' &&
            (side() === 'top' || side() === 'bottom') &&
            'left-1/2 -translate-x-1/2',
          align() === 'end' &&
            (side() === 'top' || side() === 'bottom') &&
            'right-0',
          local.class,
          local.className,
        )}
        style={{
          'margin-top': side() === 'bottom' ? offset() : undefined,
          'margin-bottom': side() === 'top' ? offset() : undefined,
          'margin-left': side() === 'right' ? offset() : undefined,
          'margin-right': side() === 'left' ? offset() : undefined,
          ...local.style,
        }}
        {...rest}
      >
        {local.children}
      </div>
    </Show>
  );
}

function PopoverAnchor(
  props: JSX.IntrinsicElements['div'] & { asChild?: boolean },
) {
  const [local, rest] = splitProps(props, ['asChild', 'children']);
  return (
    <Show
      when={local.asChild}
      fallback={
        <div data-slot="popover-anchor" {...rest}>
          {local.children}
        </div>
      }
    >
      {local.children}
    </Show>
  );
}

function PopoverHeader(props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="popover-header"
      class={cn('flex flex-col gap-1 text-sm', local.class, local.className)}
      {...rest}
    />
  );
}

function PopoverTitle(props: ClassName<JSX.IntrinsicElements['h2']>) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <div
      data-slot="popover-title"
      class={cn('font-medium', local.class, local.className)}
      {...rest}
    />
  );
}

function PopoverDescription(props: ClassName<JSX.IntrinsicElements['p']>) {
  const [local, rest] = splitProps(props, ['class', 'className']);
  return (
    <p
      data-slot="popover-description"
      class={cn('text-muted-foreground', local.class, local.className)}
      {...rest}
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

type ClassName<T> = Omit<T, 'class' | 'className'> & {
  class?: string;
  className?: string;
};

type PopoverProps = ClassName<JSX.IntrinsicElements['div']> & {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type PopoverContentProps = ClassName<
  Omit<JSX.IntrinsicElements['div'], 'style'>
> & {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  onOpenAutoFocus?: (event: Event) => void;
  style?: JSX.CSSProperties;
};
