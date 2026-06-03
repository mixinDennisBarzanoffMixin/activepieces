import * as ContextMenuPrimitive from '@kobalte/core/context-menu';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-solid';
import {
  mergeProps,
  splitProps,
  type ComponentProps,
  type JSX,
} from 'solid-js';

import { cn } from '@/lib/utils';

function ContextMenu(props: ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger(
  props: ComponentProps<typeof ContextMenuPrimitive.Trigger>,
) {
  return (
    <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
  );
}

function ContextMenuGroup(
  props: ComponentProps<typeof ContextMenuPrimitive.Group>,
) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  );
}

function ContextMenuPortal(
  props: ComponentProps<typeof ContextMenuPrimitive.Portal>,
) {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
  );
}

function ContextMenuSub(
  props: ComponentProps<typeof ContextMenuPrimitive.Sub>,
) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

function ContextMenuRadioGroup(
  props: ComponentProps<typeof ContextMenuPrimitive.RadioGroup>,
) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  );
}

function ContextMenuSubTrigger(_props: ContextMenuSubTriggerProps) {
  const [local, rest] = splitProps(_props, ['className', 'inset', 'children']);
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={local.inset}
      class={cn(
        "flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        local.className,
      )}
      {...rest}
    >
      {local.children}
      <ChevronRightIcon class="ml-auto" />
    </ContextMenuPrimitive.SubTrigger>
  );
}

function ContextMenuSubContent(
  _props: ClassName<ComponentProps<typeof ContextMenuPrimitive.SubContent>>,
) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <ContextMenuPrimitive.SubContent
      data-slot="context-menu-sub-content"
      class={cn(
        'z-50 min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        local.className,
      )}
      {...rest}
    />
  );
}

function ContextMenuContent(
  _props: ClassName<ComponentProps<typeof ContextMenuPrimitive.Content>>,
) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        class={cn(
          'z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          local.className,
        )}
        {...rest}
      />
    </ContextMenuPrimitive.Portal>
  );
}

function ContextMenuItem(_props: ContextMenuItemProps) {
  const [local, rest] = splitProps(mergeProps({ variant: 'default' }, _props), [
    'className',
    'inset',
    'variant',
  ]);
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={local.inset}
      data-variant={local.variant}
      class={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4  data-[variant=destructive]:*:[svg]:text-destructive!",
        local.className,
      )}
      {...rest}
    />
  );
}

function ContextMenuCheckboxItem(_props: ContextMenuCheckboxItemProps) {
  const [local, rest] = splitProps(_props, [
    'className',
    'children',
    'checked',
  ]);
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      class={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        local.className,
      )}
      checked={local.checked}
      {...rest}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon class="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {local.children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

function ContextMenuRadioItem(
  _props: ClassName<ComponentProps<typeof ContextMenuPrimitive.RadioItem>>,
) {
  const [local, rest] = splitProps(_props, ['className', 'children']);
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      class={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        local.className,
      )}
      {...rest}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CircleIcon class="size-2 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {local.children}
    </ContextMenuPrimitive.RadioItem>
  );
}

function ContextMenuLabel(props: ContextMenuLabelProps) {
  const [local, rest] = splitProps(props, ['className', 'inset']);
  return (
    <ContextMenuPrimitive.GroupLabel
      data-slot="context-menu-label"
      data-inset={local.inset}
      class={cn(
        'px-2 py-1.5 text-sm font-medium text-foreground data-[inset]:pl-8',
        local.className,
      )}
      {...rest}
    />
  );
}

function ContextMenuSeparator(
  _props: ClassName<ComponentProps<typeof ContextMenuPrimitive.Separator>>,
) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      class={cn('-mx-1 my-1 h-px bg-border', local.className)}
      {...rest}
    />
  );
}

function ContextMenuShortcut(_props: ClassName<JSX.IntrinsicElements['span']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <span
      data-slot="context-menu-shortcut"
      class={cn('ml-auto text-xs tracking-widest', local.className)}
      {...rest}
    />
  );
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

type ContextMenuSubTriggerProps = ClassName<
  ComponentProps<typeof ContextMenuPrimitive.SubTrigger>
> & {
  inset?: boolean;
};

type ContextMenuItemProps = ClassName<
  ComponentProps<typeof ContextMenuPrimitive.Item>
> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
};

type ContextMenuCheckboxItemProps = ClassName<
  Omit<ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>, 'checked'>
> & {
  checked?: boolean | 'indeterminate';
};

type ContextMenuLabelProps = ClassName<
  ComponentProps<typeof ContextMenuPrimitive.GroupLabel>
> & {
  inset?: boolean;
};
