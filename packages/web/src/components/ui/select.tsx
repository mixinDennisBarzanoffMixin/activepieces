import * as SelectPrimitive from '@kobalte/core/select';
import {
  CheckIcon,
  ChevronsUpDown,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-solid';
import { splitProps, type ComponentProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

function Select(props: ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup(props: ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue(props: ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger(props: SelectTriggerProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'size',
    'children',
  ]);
  const size = () => local.size ?? 'default';

  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size()}
      class={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        local.class,
        local.className,
      )}
      {...rest}
    >
      {local.children}
      <SelectPrimitive.Icon asChild>
        <ChevronsUpDown class="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent(props: SelectContentProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'children',
    'position',
    'align',
  ]);
  const position = () => local.position ?? 'popper';
  const align = () => local.align ?? 'center';

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        class={cn(
          'relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          position() === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          local.class,
          local.className,
        )}
        position={position()}
        align={align()}
        {...rest}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          class={cn(
            'p-1',
            position() === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1',
          )}
        >
          {local.children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel(props: SelectLabelProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      class={cn(
        'px-2 py-1.5 text-xs text-muted-foreground',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SelectItem(props: SelectItemProps) {
  const [local, rest] = splitProps(props, ['class', 'className', 'children']);

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      class={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        local.class,
        local.className,
      )}
      {...rest}
    >
      <span
        data-slot="select-item-indicator"
        class="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon class="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{local.children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectAction(props: SelectActionProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'children',
    'disabled',
    'onClick',
  ]);

  return (
    <div
      data-slot="select-action"
      class={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground',
        local.class,
        local.className,
        { 'text-muted-foreground cursor-not-allowed': local.disabled },
      )}
      onClick={(e) => {
        if (local.disabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        local.onClick?.(e);
      }}
      {...rest}
    >
      {local.children}
    </div>
  );
}

function SelectSeparator(props: SelectSeparatorProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      class={cn(
        'pointer-events-none -mx-1 my-1 h-px bg-border',
        local.class,
        local.className,
      )}
      {...rest}
    />
  );
}

function SelectScrollUpButton(props: SelectScrollButtonProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      class={cn(
        'flex cursor-default items-center justify-center py-1',
        local.class,
        local.className,
      )}
      {...rest}
    >
      <ChevronUpIcon class="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton(props: SelectScrollButtonProps) {
  const [local, rest] = splitProps(props, ['class', 'className']);

  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      class={cn(
        'flex cursor-default items-center justify-center py-1',
        local.class,
        local.className,
      )}
      {...rest}
    >
      <ChevronDownIcon class="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectAction,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};

type SelectTriggerProps = Omit<
  ComponentProps<typeof SelectPrimitive.Trigger>,
  'class'
> & {
  class?: string;
  className?: string;
  size?: 'sm' | 'default';
};

type SelectContentProps = Omit<
  ComponentProps<typeof SelectPrimitive.Content>,
  'class'
> & {
  class?: string;
  className?: string;
  position?: 'popper' | 'item-aligned';
  align?: 'start' | 'center' | 'end';
};

type SelectLabelProps = Omit<
  ComponentProps<typeof SelectPrimitive.Label>,
  'class'
> & {
  class?: string;
  className?: string;
};

type SelectItemProps = Omit<
  ComponentProps<typeof SelectPrimitive.Item>,
  'class'
> & {
  class?: string;
  className?: string;
};

type SelectActionProps = JSX.IntrinsicElements['div'] & {
  className?: string;
  disabled?: boolean;
};

type SelectSeparatorProps = Omit<
  ComponentProps<typeof SelectPrimitive.Separator>,
  'class'
> & {
  class?: string;
  className?: string;
};

type SelectScrollButtonProps = Omit<
  ComponentProps<typeof SelectPrimitive.ScrollUpButton>,
  'class'
> & {
  class?: string;
  className?: string;
};
