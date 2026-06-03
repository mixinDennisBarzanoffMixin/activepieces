import * as DropdownMenuPrimitive from '@kobalte/core/dropdown-menu';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-solid';
import {
  createEffect,
  mergeProps,
  splitProps,
  type ComponentProps,
  type JSX,
} from 'solid-js';

import { cn } from '@/lib/utils';

function DropdownMenu(
  props: ComponentProps<typeof DropdownMenuPrimitive.Root>,
) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal(
  props: ComponentProps<typeof DropdownMenuPrimitive.Portal>,
) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger(
  props: ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent(props: DropdownMenuContentProps) {
  const [local, rest] = splitProps(props, [
    'className',
    'sideOffset',
    'noAnimationOnOut',
  ]);
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={local.sideOffset ?? 4}
        class={cn(
          'z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          {
            'data-[state=closed]:animate-out': !(
              local.noAnimationOnOut ?? false
            ),
          },
          local.className,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup(
  _props: ComponentProps<typeof DropdownMenuPrimitive.Group>,
) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {..._props} />
  );
}

function DropdownMenuItem(_props: DropdownMenuItemProps) {
  const [local, rest] = splitProps(mergeProps({ variant: 'default' }, _props), [
    'className',
    'inset',
    'variant',
  ]);
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={local.inset}
      data-variant={local.variant}
      class={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:outline-hidden focus-visible:outline-hidden select-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive!",
        local.className,
      )}
      {...rest}
    />
  );
}

function DropdownMenuCheckboxItem(_props: DropdownMenuCheckboxItemProps) {
  const [local, rest] = splitProps(_props, [
    'className',
    'children',
    'checked',
  ]);
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      class={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden focus:outline-hidden focus-visible:outline-hidden select-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        local.className,
      )}
      checked={local.checked}
      {...rest}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon class="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {local.children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup(
  _props: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>,
) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {..._props}
    />
  );
}

function DropdownMenuRadioItem(
  _props: ClassName<ComponentProps<typeof DropdownMenuPrimitive.RadioItem>>,
) {
  const [local, rest] = splitProps(_props, ['className', 'children']);
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      class={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden focus:outline-hidden focus-visible:outline-hidden select-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        local.className,
      )}
      {...rest}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon class="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {local.children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel(props: DropdownMenuLabelProps) {
  const [local, rest] = splitProps(props, ['className', 'inset']);
  return (
    <DropdownMenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={local.inset}
      class={cn(
        'px-2 py-1.5 text-sm font-medium data-[inset]:pl-8',
        local.className,
      )}
      {...rest}
    />
  );
}

function DropdownMenuSeparator(
  _props: ClassName<ComponentProps<typeof DropdownMenuPrimitive.Separator>>,
) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      class={cn('-mx-1 my-1 h-px bg-border', local.className)}
      {...rest}
    />
  );
}

function DropdownMenuShortcut(_props: DropdownMenuShortcutProps) {
  const [local, rest] = splitProps(_props, [
    'className',
    'keyboardShortcut',
    'onKeyboardShortcut',
  ]);
  createEffect(() => {
    if (local.keyboardShortcut) {
      const handler = createKeyDownHandler(
        local.keyboardShortcut,
        local.onKeyboardShortcut,
      );
      document.addEventListener('keydown', handler);
      return () => {
        document.removeEventListener('keydown', handler);
      };
    }
  });

  return (
    <span
      data-slot="dropdown-menu-shortcut"
      class={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground',
        local.className,
      )}
      {...rest}
    >
      {'\u2318'}
      {local.keyboardShortcut.toLocaleUpperCase()}
    </span>
  );
}

function DropdownMenuSub(
  _props: ComponentProps<typeof DropdownMenuPrimitive.Sub>,
) {
  return (
    <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {..._props} />
  );
}

function DropdownMenuSubTrigger(_props: DropdownMenuSubTriggerProps) {
  const [local, rest] = splitProps(_props, ['className', 'inset', 'children']);
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={local.inset}
      class={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:outline-hidden focus-visible:outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        local.className,
      )}
      {...rest}
    >
      {local.children}
      <ChevronRightIcon class="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent(
  _props: ClassName<ComponentProps<typeof DropdownMenuPrimitive.SubContent>>,
) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      class={cn(
        'z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        local.className,
      )}
      {...rest}
    />
  );
}

// Helper functions

function createKeyDownHandler(
  keyboardShortcut: string,
  onKeyboardShortcut: () => void,
) {
  return (event: KeyboardEvent) => {
    if (
      event.key === keyboardShortcut.toLocaleLowerCase() &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (onKeyboardShortcut) {
        onKeyboardShortcut();
      }
    }
  };
}

// Type definitions

type DropdownMenuContentProps = ClassName<
  Omit<ComponentProps<typeof DropdownMenuPrimitive.Content>, 'sideOffset'>
> & {
  /**
   * This is needed because animation out changes the focus after the animation
   * is done leading into race conditions i.e when an item is clicked, the menu
   * closes and the item is focused, but the animation is not complete yet so
   * the item is not focused and the menu is open. So we need to disable the
   * animation on out.
   */
  noAnimationOnOut?: boolean;
  sideOffset?: number;
};

type DropdownMenuItemProps = ClassName<
  ComponentProps<typeof DropdownMenuPrimitive.Item>
> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
};

type DropdownMenuCheckboxItemProps = ClassName<
  Omit<ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>, 'checked'>
> & {
  checked?: boolean | 'indeterminate';
};

type DropdownMenuLabelProps = ClassName<
  ComponentProps<typeof DropdownMenuPrimitive.GroupLabel>
> & {
  inset?: boolean;
};

type DropdownMenuShortcutProps = JSX.IntrinsicElements['span'] & {
  keyboardShortcut: string;
  onKeyboardShortcut: () => void;
  className?: string;
};

type DropdownMenuSubTriggerProps = ClassName<
  ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>
> & {
  inset?: boolean;
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
