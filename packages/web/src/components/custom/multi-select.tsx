'use client';

// Used form here https://github.com/shadcn-ui/ui/pull/2773/files
import {
  type CommandEmptyProps,
  type CommandGroupProps,
  type CommandInputProps,
  type CommandItemProps,
  type CommandListProps,
  type CommandSeparatorProps,
} from 'cmdk-solid';
import { t } from 'i18next';
import { Check, ChevronsUpDown, RefreshCcw, X } from 'lucide-solid';
import {
  createContext,
  createMemo,
  createSignal,
  For,
  JSX,
  mergeProps,
  Show,
  splitProps,
  useContext,
} from 'solid-js';

import { SelectUtilButton } from '@/components/custom/select-util-button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { ButtonProps } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../ui/command';
import { ScrollArea } from '../ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

export interface MultiSelectOptionItem {
  value: unknown;
  label?: JSX.Element;
}

interface MultiSelectContextValue {
  value: string[];

  open: boolean;

  onSelect: (value: string, item: MultiSelectOptionItem) => void;

  onDeselect: (value: string, item: MultiSelectOptionItem) => void;

  onSearch?(keyword: string | undefined): void;

  filter?: boolean | ((keyword: string, current: string) => boolean);

  disabled?: boolean;

  maxCount?: number;

  items: MultiSelectOptionItem[];
}

const MultiSelectContext = createContext<MultiSelectContextValue | undefined>(
  undefined,
);

const useMultiSelect = () => {
  const context = useContext(MultiSelectContext);

  if (!context) {
    throw new Error(
      t('useMultiSelect must be used within MultiSelectProvider'),
    );
  }

  return context;
};

function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop: () => T | undefined;
  defaultProp: T;
  onChange?: (value: T) => void;
}): [() => T, (value: T) => void] {
  const [state, setState] = createSignal(defaultProp);
  const value = createMemo(() => {
    const next = prop();
    if (next !== undefined) {
      return next;
    }
    return state();
  });
  return [
    value,
    (value: T) => {
      setState(() => value);
      onChange?.(value);
    },
  ];
}

type MultiSelectProps = JSX.HTMLAttributes<HTMLDivElement> & {
  value?: string[];
  onValueChange?(value: string[], items: MultiSelectOptionItem[]): void;
  onSelect?(value: string, item: MultiSelectOptionItem): void;
  onDeselect?(value: string, item: MultiSelectOptionItem): void;
  defaultValue?: string[];
  onSearch?(keyword: string | undefined): void;
  filter?: boolean | ((keyword: string, current: string) => boolean);
  disabled?: boolean;
  maxCount?: number;
  items?: MultiSelectOptionItem[];
  open?: boolean;
  onOpenChange?(open: boolean): void;
  defaultOpen?: boolean;
};

const MultiSelect = (_props: MultiSelectProps) => {
  const merged = mergeProps(
    { defaultOpen: false, defaultValue: [], items: [] },
    _props,
  );
  const [props, rest] = splitProps(merged, [
    'value',
    'onValueChange',
    'onDeselect',
    'onSelect',
    'defaultValue',
    'open',
    'onOpenChange',
    'defaultOpen',
    'onSearch',
    'filter',
    'disabled',
    'maxCount',
    'items',
    'children',
  ]);
  const handleValueChange = (state: string[]) => {
    if (props.onValueChange) {
      const resolved = state.map(
        (v) =>
          props.items.find((item) => String(item.value) === v) || { value: v },
      );

      props.onValueChange(state, resolved);
    }
  };

  const [value, setValue] = useControllableState({
    prop: () => props.value,
    defaultProp: props.defaultValue,
    onChange: handleValueChange,
  });

  const [open, setOpen] = useControllableState({
    prop: () => props.open,
    defaultProp: props.defaultOpen,
    onChange: (value) => props.onOpenChange?.(value),
  });

  const handleSelect = (selectedValue: string, item: MultiSelectOptionItem) => {
    const state = value();

    if (state.includes(selectedValue)) {
      return;
    }

    props.onSelect?.(selectedValue, item);
    setValue([...state, selectedValue]);
  };

  const handleDeselect = (
    selectedValue: string,
    item: MultiSelectOptionItem,
  ) => {
    const state = value();

    if (!state.includes(selectedValue)) {
      return;
    }

    props.onDeselect?.(selectedValue, item);
    setValue(state.filter((value) => value !== selectedValue));
  };

  return (
    <MultiSelectContext.Provider
      value={{
        get value() {
          return value();
        },
        get open() {
          return open();
        },
        get onSearch() {
          return props.onSearch;
        },
        get filter() {
          return props.filter;
        },
        get disabled() {
          return props.disabled;
        },
        get maxCount() {
          return props.maxCount;
        },
        get items() {
          return props.items;
        },
        onSelect: handleSelect,
        onDeselect: handleDeselect,
      }}
    >
      <Popover {...rest} open={open()} onOpenChange={setOpen}>
        {props.children}
      </Popover>
    </MultiSelectContext.Provider>
  );
};

type MultiSelectTriggerElement = HTMLButtonElement;

type MultiSelectTriggerProps = ButtonProps & {
  showDeselect?: boolean;
  onDeselect?: () => void;
  showRefresh?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
};

const PreventClick = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

const MultiSelectTrigger = (
  props: MultiSelectTriggerProps & { ref?: MultiSelectTriggerElement },
) => {
  const context = useMultiSelect();

  return (
    <PopoverTrigger ref={props.ref} asChild>
      <Button
        variant="outline"
        aria-disabled={context.disabled}
        disabled={context.disabled}
        role="combobox"
        type="button"
        loading={props.loading}
        class={cn(
          'flex min-h-9 h-auto w-full items-center justify-between cursor-pointer gap-2 whitespace-nowrap rounded-sm border border-input bg-transparent px-4 py-1 text-sm ring-offset-background focus:outline-hidden focus:ring-1 focus:ring-ring [&>span]:line-clamp-1',
          {
            'cursor-not-allowed opacity-80': context.disabled,
            'cursor-pointer': !context.disabled,
          },
          props.className,
        )}
        onClick={context.disabled ? PreventClick : props.onClick}
        onTouchStart={context.disabled ? PreventClick : props.onTouchStart}
      >
        {props.children}
        <div class="flex gap-2 items-center">
          <Show when={props.showDeselect}>
            <SelectUtilButton
              tooltipText={t('Unset')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onDeselect?.();
              }}
              Icon={X}
            />
          </Show>
          <Show when={props.showRefresh}>
            <SelectUtilButton
              tooltipText={t('Refresh')}
              onClick={props.onRefresh}
              Icon={RefreshCcw}
            />
          </Show>
          <ChevronsUpDown aria-hidden class="h-4 w-4 opacity-50 shrink-0" />
        </div>
      </Button>
    </PopoverTrigger>
  );
};

type MultiSelectValueProps = ClassName<JSX.HTMLAttributes<HTMLDivElement>> & {
  placeholder?: string;
  maxDisplay?: number;
  maxItemLength?: number;
};

const MultiSelectValue = (
  props: MultiSelectValueProps & { ref?: HTMLDivElement },
) => {
  const context = useMultiSelect();

  const count = createMemo(() =>
    props.maxDisplay && context.value.length > props.maxDisplay
      ? context.value.length - props.maxDisplay
      : 0,
  );
  const items = createMemo(() =>
    count() ? context.value.slice(0, props.maxDisplay) : context.value,
  );

  return (
    <Show
      when={context.value.length}
      fallback={
        <span class="pointer-events-none text-muted-foreground opacity-80">
          {props.placeholder}
        </span>
      }
    >
      <TooltipProvider delayDuration={300}>
        <div
          class={cn(
            'flex flex-1 overflow-x-hidden flex-wrap items-center gap-1.5',
            props.className,
          )}
          {...props}
          ref={props.ref}
        >
          <For each={items()}>
            {(value) => {
              const item = context.items.find((i) => String(i.value) === value);
              const content = item?.label || value;
              const child =
                props.maxItemLength &&
                typeof content === 'string' &&
                content.length > props.maxItemLength
                  ? `${content.slice(0, props.maxItemLength)}...`
                  : content;
              const option = item || { value };

              return (
                <Show
                  when={child !== content}
                  fallback={
                    <Badge
                      variant="outline"
                      class={cn(
                        'pr-1.5 items-center justify-center group/multi-select-badge rounded-full',
                        {
                          'cursor-pointer': !context.disabled,
                          'cursor-not-allowed opacity-80': context.disabled,
                        },
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        context.onDeselect(value, option);
                      }}
                    >
                      <span>{child}</span>
                      <Show when={!context.disabled}>
                        <X class="h-3 w-3 ml-1 text-muted-foreground group-hover/multi-select-badge:text-foreground" />
                      </Show>
                    </Badge>
                  }
                >
                  <Tooltip>
                    <TooltipTrigger class="inline-flex">
                      <Badge
                        variant="outline"
                        class={cn(
                          'pr-1.5 items-center justify-center group/multi-select-badge rounded-full',
                          {
                            'cursor-pointer': !context.disabled,
                            'cursor-not-allowed opacity-80': context.disabled,
                          },
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          context.onDeselect(value, option);
                        }}
                      >
                        <span>{child}</span>
                        <Show when={!context.disabled}>
                          <X class="h-3 w-3 ml-1 text-muted-foreground group-hover/multi-select-badge:text-foreground" />
                        </Show>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" class="z-51">
                      {content}
                    </TooltipContent>
                  </Tooltip>
                </Show>
              );
            }}
          </For>
          <Show when={count()}>
            <span class="text-muted-foreground text-xs leading-4 py-.5">
              {t('+{remainingPiecesCount} more', {
                remainingPiecesCount: count(),
              })}
            </span>
          </Show>
        </div>
      </TooltipProvider>
    </Show>
  );
};

type MultiSelectSearchProps = ClassName<CommandInputProps> & {
  containerClassName?: string;
  ref?: HTMLInputElement;
};

const MultiSelectSearch = (props: MultiSelectSearchProps) => {
  const context = useMultiSelect();

  return (
    <CommandInput
      ref={props.ref}
      {...props}
      onValueChange={(value) => context.onSearch?.(value)}
    />
  );
};

type MultiSelectListProps = ClassName<CommandListProps> & {
  ref?: HTMLDivElement;
};

const MultiSelectList = (props: MultiSelectListProps) => {
  return (
    <CommandList
      ref={props.ref}
      class={cn('py-1 px-0 ', props.className)}
      {...props}
    >
      <ScrollArea viewPortClassName="max-h-[200px]">
        {props.children}
      </ScrollArea>
    </CommandList>
  );
};

type MultiSelectContentProps = PopoverContentProps & {
  ref?: HTMLDivElement;
};

const MultiSelectContent = (props: MultiSelectContentProps) => {
  const context = useMultiSelect();

  return (
    <Show when={context.open}>
      <PopoverContent
        ref={props.ref}
        align="start"
        sideOffset={4}
        class={cn(
          'z-50 rounded-md border bg-background p-0 text-foreground shadow-md outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        )}
        style={{
          '--radix-select-content-transform-origin':
            'var(--radix-popper-transform-origin)',
          '--radix-select-content-available-width':
            'var(--radix-popper-available-width)',
          '--radix-select-content-available-height':
            'var(--radix-popper-available-height)',
          '--radix-select-trigger-width': 'var(--radix-popper-anchor-width)',
          '--radix-select-trigger-height': 'var(--radix-popper-anchor-height)',
          width: 'var(--radix-popper-anchor-width)',
        }}
        {...props}
      >
        <Command
          class={cn('px-1 max-h-96 w-full', props.className)}
          shouldFilter={!context.onSearch}
        >
          {props.children}
        </Command>
      </PopoverContent>
    </Show>
  );
};

type MultiSelectItemProps = Omit<
  ClassName<CommandItemProps>,
  'onSelect' | 'value'
> &
  Partial<MultiSelectOptionItem> & {
    onSelect?: (value: string, item: MultiSelectOptionItem) => void;
    onDeselect?: (value: string, item: MultiSelectOptionItem) => void;
  };

const MultiSelectItem = (
  props: MultiSelectItemProps & { ref?: HTMLDivElement },
) => {
  const context = useMultiSelect();

  const item = createMemo(() => {
    return props.value !== undefined
      ? {
          value: props.value,
          label:
            props.label ||
            (typeof props.children === 'string' ? props.children : undefined),
        }
      : undefined;
  });

  const optionValue = () => {
    if (props.value !== undefined) {
      return String(props.value);
    }
    return '';
  };
  const selected = () =>
    props.value !== undefined && context.value.includes(optionValue());

  const disabled = () =>
    Boolean(
      props.disabled ||
        (!selected() &&
          context.maxCount &&
          context.value.length >= context.maxCount),
    );

  const handleClick = () => {
    const option = item() || { value: optionValue() };

    if (selected()) {
      props.onDeselect?.(optionValue(), option);
      context.onDeselect(optionValue(), option);
      return;
    }

    props.onSelect?.(optionValue(), option);
    context.onSelect(optionValue(), option);
  };

  return (
    <CommandItem
      {...props}
      value={optionValue()}
      class={cn(
        'cursor-pointer',
        disabled() && 'text-muted-foreground cursor-not-allowed',
        props.className,
      )}
      disabled={disabled()}
      onSelect={
        !disabled() && props.value !== undefined ? handleClick : undefined
      }
      ref={props.ref}
    >
      <div class="flex items-center justify-between w-full min-w-0">
        <span class="truncate min-w-0 grow">
          {props.children || props.label || props.value}
        </span>
        <Show when={selected()}>
          <Check class="h-4 w-4 shrink-0" />
        </Show>
      </div>
    </CommandItem>
  );
};

const MultiSelectGroup = (
  props: ClassName<CommandGroupProps> & { ref?: HTMLDivElement },
) => {
  return <CommandGroup {...props} ref={props.ref} />;
};

const MultiSelectSeparator = (
  props: ClassName<CommandSeparatorProps> & { ref?: HTMLDivElement },
) => {
  return <CommandSeparator {...props} ref={props.ref} />;
};

const MultiSelectEmpty = (
  props: CommandEmptyProps & { ref?: HTMLDivElement },
) => {
  return (
    <CommandEmpty {...props} ref={props.ref}>
      <Show when={props.children} fallback="No Content">
        {props.children}
      </Show>
    </CommandEmpty>
  );
};

export interface MultiSelectOptionSeparator {
  type: 'separator';
}

export interface MultiSelectOptionGroup {
  heading?: JSX.Element;
  value?: string;
  children: MultiSelectOption[];
}

export type MultiSelectOption = {
  value: unknown;
  label: string;
};

export {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectSearch,
  MultiSelectContent,
  MultiSelectList,
  MultiSelectItem,
  MultiSelectGroup,
  MultiSelectSeparator,
  MultiSelectEmpty,
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
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
