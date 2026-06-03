import {
  CommandEmpty as CommandPrimitiveEmpty,
  CommandGroup as CommandPrimitiveGroup,
  CommandInput as CommandPrimitiveInput,
  CommandItem as CommandPrimitiveItem,
  CommandList as CommandPrimitiveList,
  CommandRoot as CommandPrimitive,
  CommandSeparator as CommandPrimitiveSeparator,
  type CommandEmptyProps,
  type CommandGroupProps,
  type CommandInputProps,
  type CommandItemProps,
  type CommandListProps,
  type CommandRootProps,
  type CommandSeparatorProps,
} from 'cmdk-solid';
import { SearchIcon } from 'lucide-solid';
import { splitProps, type JSX } from 'solid-js';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function Command(props: ClassName<CommandRootProps>) {
  const [local, rest] = splitProps(props, ['className', 'children']);
  return (
    <CommandPrimitive
      data-slot="command"
      class={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
        local.className,
      )}
      {...rest}
    >
      {local.children}
    </CommandPrimitive>
  );
}

function CommandDialog(
  props: Parameters<typeof Dialog>[0] & {
    title?: string;
    description?: string;
    className?: string;
    showCloseButton?: boolean;
    shouldFilter?: boolean;
    commandValue?: string;
    onCommandValueChange?: (value: string) => void;
  },
) {
  const [local, rest] = splitProps(props, [
    'title',
    'description',
    'className',
    'showCloseButton',
    'shouldFilter',
    'commandValue',
    'onCommandValueChange',
    'children',
  ]);
  return (
    <Dialog {...rest}>
      <DialogContent
        class={cn('overflow-hidden p-0', local.className)}
        showCloseButton={local.showCloseButton ?? true}
      >
        <DialogHeader class="sr-only">
          <DialogTitle>{local.title ?? 'Command Palette'}</DialogTitle>
          <DialogDescription>
            {local.description ?? 'Search for a command to run...'}
          </DialogDescription>
        </DialogHeader>
        <Command
          shouldFilter={local.shouldFilter ?? true}
          value={local.commandValue}
          onValueChange={local.onCommandValueChange}
          class="**:data-[slot=command-input-wrapper]:h-12 [&_[data-slot=command-group]]:px-2 [&_[data-slot=command-input-wrapper]_svg]:h-5 [&_[data-slot=command-input-wrapper]_svg]:w-5 [&_[data-slot=command-input]]:h-12 [&_[data-slot=command-item]]:px-2 [&_[data-slot=command-item]]:py-3 [&_[data-slot=command-item]_svg]:h-5 [&_[data-slot=command-item]_svg]:w-5"
        >
          {local.children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput(_props: CommandInputWrapperProps) {
  const [local, rest] = splitProps(_props, [
    'className',
    'containerClassName',
    'disabled',
  ]);
  return (
    <div
      data-slot="command-input-wrapper"
      class={cn(
        'flex h-9 items-center gap-2 border-b px-3',
        local.containerClassName,
      )}
    >
      <SearchIcon class="size-4 shrink-0 opacity-50" />
      <CommandPrimitiveInput
        data-slot="command-input"
        class={cn(
          'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          { 'cursor-not-allowed opacity-50': local.disabled },
          local.className,
        )}
        disabled={local.disabled}
        {...rest}
      />
    </div>
  );
}

function CommandList(_props: ClassName<CommandListProps>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <CommandPrimitiveList
      data-slot="command-list"
      class={cn(
        'max-h-[300px] overflow-x-hidden overflow-y-hidden',
        local.className,
      )}
      {...rest}
    />
  );
}

function CommandEmpty(_props: CommandEmptyProps) {
  return (
    <CommandPrimitiveEmpty
      data-slot="command-empty"
      class="py-6 text-center text-sm"
      {..._props}
    />
  );
}

function CommandGroup(props: ClassName<CommandGroupProps>) {
  const [local, rest] = splitProps(props, ['className', 'heading', 'children']);
  return (
    <CommandPrimitiveGroup
      data-slot="command-group"
      class={cn('overflow-hidden p-1 text-foreground', local.className)}
      heading={local.heading}
      {...rest}
    >
      {local.children}
    </CommandPrimitiveGroup>
  );
}

function CommandSeparator(_props: ClassName<CommandSeparatorProps>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <CommandPrimitiveSeparator
      data-slot="command-separator"
      class={cn('-mx-1 h-px bg-border', local.className)}
      {...rest}
    />
  );
}

function CommandItem(_props: ClassName<CommandItemProps>) {
  const [local, rest] = splitProps(_props, [
    'className',
    'disabled',
    'onSelect',
  ]);
  return (
    <CommandPrimitiveItem
      data-slot="command-item"
      disabled={local.disabled}
      class={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        { 'pointer-events-none opacity-50': local.disabled },
        local.className,
      )}
      onSelect={local.onSelect}
      {...rest}
    />
  );
}

function CommandShortcut(_props: ClassName<JSX.IntrinsicElements['span']>) {
  const [local, rest] = splitProps(_props, ['className']);
  return (
    <span
      data-slot="command-shortcut"
      class={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground',
        local.className,
      )}
      {...rest}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

type CommandInputWrapperProps = ClassName<CommandInputProps> & {
  containerClassName?: string;
};
