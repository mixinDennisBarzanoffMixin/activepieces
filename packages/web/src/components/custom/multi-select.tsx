'use client';

// Used form here https://github.com/shadcn-ui/ui/pull/2773/files
import { t } from 'i18next';
import { Check, ChevronsUpDown, RefreshCcw, X } from 'lucide-solid';
import { createContext, createMemo, createSignal, For, Show, useContext } from 'solid-js';

import { SelectUtilButton } from '@/components/custom/select-util-button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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
  label?: any;
}

interface MultiSelectContextValue {
  value: string[];

  open: boolean;

  onSelect(value: string, item: MultiSelectOptionItem): void;

  onDeselect(value: string, item: MultiSelectOptionItem): void;

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
  prop?: T;
  defaultProp: T;
  onChange?: (value: T) => void;
}) {
  const [state, setState] = createSignal(defaultProp);
  return [
    () => prop ?? state(),
    (value: T) => {
      setState(() => value);
      onChange?.(value);
    },
  ] as const;
}

type MultiSelectProps = any & {
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
};

const MultiSelect = ({
  value: valueProp,
  onValueChange: onValueChangeProp,
  onDeselect: onDeselectProp,
  onSelect: onSelectProp,
  defaultValue,
  open: openProp,
  onOpenChange,
  defaultOpen,
  onSearch,
  filter,
  disabled,
  maxCount,
  items = [],
  ...popoverProps
}: MultiSelectProps) => {
  const handleValueChange = (state: string[]) => {
    if (onValueChangeProp) {
      const resolved = state.map(
        (v) => items.find((item) => String(item.value) === v) ?? { value: v },
      );

      onValueChangeProp(state, resolved);
    }
  };

  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? [],
    onChange: handleValueChange,
  });

  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
  });

  const handleSelect = (value: string, item: MultiSelectOptionItem) => {
    setValue((prev: string[]) => {
      if (prev?.includes(value)) {
        return prev;
      }

      onSelectProp?.(value, item);

      return prev ? [...prev, value] : [value];
    });
  };

  const handleDeselect = (value: string, item: MultiSelectOptionItem) => {
    setValue((prev: string[]) => {
      if (!prev || !prev.includes(value)) {
        return prev;
      }

      onDeselectProp?.(value, item);

      return prev.filter((v) => v !== value);
    });
  };

  const contextValue = createMemo(() => {
    return {
      value: value || [],
      open: open || false,
      onSearch,
      filter,
      disabled,
      maxCount,
      onSelect: handleSelect,
      onDeselect: handleDeselect,
      items,
    };
  });

  return (
    <MultiSelectContext.Provider value={contextValue()}>
      <Popover
        {...popoverProps}
        open={open}
        onOpenChange={setOpen}
      />
    </MultiSelectContext.Provider>
  );
};

MultiSelect.displayName = 'MultiSelect';

type MultiSelectTriggerElement = HTMLButtonElement;

type MultiSelectTriggerProps = any & {
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
  const { disabled } = useMultiSelect();
  let ref: HTMLButtonElement | undefined;

  return (
    <PopoverTrigger ref={(el) => (ref = el)} asChild>
      <Button
        variant="outline"
        aria-disabled={disabled}
        disabled={disabled}
        role="combobox"
        type="button"
        loading={props.loading}
        class={cn(
          'flex min-h-9 h-auto w-full items-center justify-between cursor-pointer gap-2 whitespace-nowrap rounded-sm border border-input bg-transparent px-4 py-1 text-sm ring-offset-background focus:outline-hidden focus:ring-1 focus:ring-ring [&>span]:line-clamp-1',
          {
            'cursor-not-allowed opacity-80': disabled,
            'cursor-pointer': !disabled,
          },
          props.className,
        )}
        onClick={disabled ? PreventClick : props.onClick}
        onTouchStart={disabled ? PreventClick : props.onTouchStart}
      >
        {props.children}
        <div className="flex gap-2 items-center">
          <Show when={props.showDeselect}>
            <SelectUtilButton
              tooltipText={t('Unset')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onDeselect?.();
              }}
              Icon={X}
            ></SelectUtilButton>
          </Show>
          <Show when={props.showRefresh}>
            <SelectUtilButton
              tooltipText={t('Refresh')}
              onClick={props.onRefresh}
              Icon={RefreshCcw}
            ></SelectUtilButton>
          </Show>
          <ChevronsUpDown aria-hidden class="h-4 w-4 opacity-50 shrink-0" />
        </div>
      </Button>
    </PopoverTrigger>
  );
};

MultiSelectTrigger.displayName = 'MultiSelectTrigger';

interface MultiSelectValueProps extends any {
  placeholder?: string;
  maxDisplay?: number;
  maxItemLength?: number;
}

const MultiSelectValue = (
  props: MultiSelectValueProps & { ref?: HTMLDivElement },
) => {
  let ref: HTMLDivElement | undefined;
  const { value, items, onDeselect, disabled } = useMultiSelect();

  const remainingPiecesCount =
    props.maxDisplay && value.length > props.maxDisplay
      ? value.length - props.maxDisplay
      : 0;
  const renderItems = remainingPiecesCount
    ? value.slice(0, props.maxDisplay)
    : value;

  if (!value.length) {
    return (
      <span className="pointer-events-none text-muted-foreground opacity-80">
        {props.placeholder}
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex flex-1 overflow-x-hidden flex-wrap items-center gap-1.5',
          props.className,
        )}
        {...props}
        ref={(el) => (ref = el)}
      >
        <For each={renderItems}>
          {(value) => {
            const item = items.find((i) => String(i.value) === value);
            const content = item?.label || value;
            const child =
              props.maxItemLength &&
              typeof content === 'string' &&
              content.length > props.maxItemLength
                ? `${content.slice(0, props.maxItemLength)}...`
                : content;

            const el = (
              <Badge
                variant="outline"
                class={cn(
                  'pr-1.5 items-center justify-center group/multi-select-badge rounded-full',
                  {
                    'cursor-pointer': !disabled,
                    'cursor-not-allowed opacity-80': disabled,
                  },
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeselect(value, item!);
                }}
              >
                <span>{child}</span>
                <Show when={!disabled}>
                  <X class="h-3 w-3 ml-1 text-muted-foreground group-hover/multi-select-badge:text-foreground" />
                </Show>
              </Badge>
            );

            if (child !== content) {
              return (
                <Tooltip>
                  <TooltipTrigger class="inline-flex">{el}</TooltipTrigger>
                  <TooltipContent side="bottom" align="start" class="z-51">
                    {content}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return el;
          }}
        </For>
        <Show when={remainingPiecesCount}>
          <span className="text-muted-foreground text-xs leading-4 py-.5">
            {t('+{remainingPiecesCount} more', {
              remainingPiecesCount: remainingPiecesCount,
            })}
          </span>
        </Show>
      </div>
    </TooltipProvider>
  );
};
MultiSelectValue.displayName = 'MultiSelectValue';

const MultiSelectSearch = (props: any & { ref?: any }) => {
  const { onSearch } = useMultiSelect();

  return <CommandInput ref={props.ref} {...props} onValueChange={onSearch} />;
};

MultiSelectSearch.displayName = 'MultiSelectSearch';

const MultiSelectList = (props: any & { ref?: any }) => {
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

MultiSelectList.displayName = 'MultiSelectList';

type MultiSelectContentProps = any;

const MultiSelectContent = (props: MultiSelectContentProps & { ref?: any }) => {
  const context = useMultiSelect();

  if (!context.open) {
    return null;
  }

  return (
      <PopoverContent
        ref={props.ref}
        align="start"
        sideOffset={4}
        class={cn(
          'z-50 rounded-md border bg-background p-0 text-foreground shadow-md outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        )}
        style={
          {
            '--radix-select-content-transform-origin':
              'var(--radix-popper-transform-origin)',
            '--radix-select-content-available-width':
              'var(--radix-popper-available-width)',
            '--radix-select-content-available-height':
              'var(--radix-popper-available-height)',
            '--radix-select-trigger-width': 'var(--radix-popper-anchor-width)',
            '--radix-select-trigger-height':
              'var(--radix-popper-anchor-height)',
            width: 'var(--radix-popper-anchor-width)',
          } as any
        }
        {...props}
      >
        <Command
          class={cn('px-1 max-h-96 w-full', props.className)}
          shouldFilter={!context.onSearch}
        >
          {props.children}
        </Command>
      </PopoverContent>
  );
};
MultiSelectContent.displayName = 'MultiSelectContent';

type MultiSelectItemProps = any &
  Partial<MultiSelectOptionItem> & {
    onSelect?: (value: string, item: MultiSelectOptionItem) => void;
    onDeselect?: (value: string, item: MultiSelectOptionItem) => void;
  };

const MultiSelectItem = (props: MultiSelectItemProps & { ref?: any }) => {
  const {
    value: contextValue,
    maxCount,
    onSelect,
    onDeselect,
  } = useMultiSelect();

  const item = createMemo(() => {
    return props.value
      ? {
          value: props.value,
          label:
            props.label ||
            (typeof props.children === 'string' ? props.children : undefined),
        }
      : undefined;
  });

  const selected = Boolean(props.value && contextValue.includes(props.value));

  const disabled = Boolean(
    props.disabled ||
      (!selected && maxCount && contextValue.length >= maxCount),
  );

  const handleClick = () => {
    if (selected) {
      props.onDeselect?.(props.value!, item()!);
      onDeselect(props.value!, item()!);
    } else {
      props.onSelect?.(props.value!, item()!);
      onSelect(props.value!, item()!);
    }
  };

  return (
    <CommandItem
      {...props}
      value={props.value}
      class={cn(
        'cursor-pointer',
        disabled && 'text-muted-foreground cursor-not-allowed',
        props.className,
      )}
      disabled={disabled}
      onSelect={!disabled && props.value ? handleClick : undefined}
      ref={props.ref}
    >
      <div className="flex items-center justify-between w-full min-w-0">
        <span className="truncate min-w-0 grow">
          {props.children || props.label || props.value}
        </span>
        <Show when={selected}>
          <Check class="h-4 w-4 shrink-0" />
        </Show>
      </div>
    </CommandItem>
  );
};
MultiSelectItem.displayName = 'MultiSelectItem';

const MultiSelectGroup = (props: any & { ref?: any }) => {
  return <CommandGroup {...props} ref={props.ref} />;
};

MultiSelectGroup.displayName = 'MultiSelectGroup';

const MultiSelectSeparator = (props: any & { ref?: any }) => {
  return <CommandSeparator {...props} ref={props.ref} />;
};

MultiSelectSeparator.displayName = 'MultiSelectSeparator';

const MultiSelectEmpty = (props: any & { ref?: any }) => {
  return (
    <CommandEmpty {...props} ref={props.ref}>
      {props.children ?? 'No Content'}
    </CommandEmpty>
  );
};

MultiSelectEmpty.displayName = 'MultiSelectEmpty';

export interface MultiSelectOptionSeparator {
  type: 'separator';
}

export interface MultiSelectOptionGroup {
  heading?: any;
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
