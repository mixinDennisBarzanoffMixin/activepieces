import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { Check, ChevronsUpDown, RefreshCcw, Trash2, X } from 'lucide-solid';
import {
  Accessor,
  createMemo,
  createSignal,
  Show,
  For,
  mergeProps,
} from 'solid-js';

import { SelectUtilButton } from '@/components/custom/select-util-button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

type SelectOption<T> = {
  value: T;
  label: string;
  description?: string;
};

type SearchableSelectProps<T> = {
  options: SelectOption<T>[];
  onChange: (value: T | null) => void;
  value: T | undefined;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  showDeselect?: boolean;
  onRefresh?: () => void;
  showRefresh?: boolean;
  onClose?: () => void;
  triggerClassName?: string;
  valuesRendering?: (value: unknown) => any;
  openState?: {
    open: Accessor<boolean>;
    setOpen: (open: boolean) => void;
  };
  refreshOnSearch?: (searchValue: string) => void;
  /**Use to show the selected option when search doesn't return the selected option */
  cachedOptions?: {
    value: T;
    label: string;
  }[];
  onOptionDelete?: (value: T) => void;
};

const useOpenState = (openStateInitializer?: {
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = createSignal(false);
  if (openStateInitializer) {
    return openStateInitializer;
  }
  return {
    open: isOpen,
    setOpen: setIsOpen,
  };
};
export const SearchableSelect = <T,>(_props: SearchableSelectProps<T>) => {
  const props = mergeProps({ cachedOptions: [] }, _props);
  let triggerRef: HTMLButtonElement | undefined;
  const [searchTerm, setSearchTerm] = createSignal('');
  const state = createMemo(() => useOpenState(props.openState));
  const open = () => state().open();
  const setOpen = (value: boolean) => state().setOpen(value);
  const triggerWidth = createMemo(() => `${triggerRef?.clientWidth ?? 0}px`);
  const selectedOption = createMemo(() =>
    [...props.cachedOptions, ...props.options].find((option) =>
      deepEqual(option.value, props.value),
    ),
  );
  const filterOptionsIndices = createMemo(() =>
    props.options
      .map((option, index) => {
        return {
          label: option.label,
          value: option.value,
          index: index,
          description: option.description ?? '',
        };
      })
      .filter((option) => {
        if (props.refreshOnSearch || searchTerm().length === 0) {
          return true;
        }
        return (
          option.label.toLowerCase().includes(searchTerm().toLowerCase()) ||
          option.description.toLowerCase().includes(searchTerm().toLowerCase())
        );
      })
      .map((option) => option.index),
  );

  const onSelect = (index: string) => {
    const optionIndex =
      Number.isInteger(parseInt(index)) && !Number.isNaN(parseInt(index))
        ? parseInt(index)
        : -1;
    setSearchTerm('');

    if (optionIndex === -1) {
      return;
    }
    const option = props.options[optionIndex];
    props.onChange(option.value);
  };
  return (
    <Popover
      modal={true}
      open={open()}
      onOpenChange={(open) => {
        if (!open) {
          props.onClose?.();
        }
        if (props.refreshOnSearch && searchTerm().length > 0) {
          props.refreshOnSearch('');
          setSearchTerm('');
        }
        setOpen(open);
      }}
    >
      <PopoverTrigger
        asChild
        classlist={{
          'cursor-not-allowed opacity-80 ': props.disabled,
        }}
        onClick={(e) => {
          if (props.disabled) {
            e.preventDefault();
          }
          e.stopPropagation();
        }}
      >
        <div class="relative">
          <Button
            ref={(el) => {
              triggerRef = el;
            }}
            variant="outline"
            disabled={props.disabled}
            role="combobox"
            loading={props.loading}
            aria-expanded={open()}
            class={cn('w-full justify-between', props.triggerClassName)}
            onClick={(e) => {
              setOpen(!open());
              e.preventDefault();
            }}
          >
            <span class="flex w-full truncate select-none">
              {selectedOption()
                ? props.valuesRendering
                  ? props.valuesRendering(selectedOption()!.value)
                  : selectedOption()!.label
                : props.placeholder}
            </span>
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          <div class="right-10 top-2 absolute flex gap-2  z-50 items-center">
            <Show
              when={
                props.showDeselect &&
                !props.disabled &&
                selectedOption() &&
                !props.loading
              }
            >
              <SelectUtilButton
                tooltipText={t('Unset')}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  props.onChange(null);
                }}
                Icon={X}
              />
            </Show>
            <Show when={props.showRefresh && !props.loading}>
              <SelectUtilButton
                tooltipText={t('Refresh')}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (props.onRefresh) {
                    props.onRefresh();
                  }
                }}
                Icon={RefreshCcw}
              />
            </Show>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        style={{
          'max-width': triggerWidth(),
          'min-width': triggerWidth(),
        }}
        class="min-w-full w-full p-0"
      >
        <Command class="w-full" shouldFilter={false}>
          <CommandInput
            placeholder={t(props.placeholder)}
            value={searchTerm()}
            onValueChange={(e) => {
              setSearchTerm(e);
              if (props.refreshOnSearch) {
                props.refreshOnSearch(e);
              }
            }}
          />
          <Show when={filterOptionsIndices().length === 0}>
            <CommandEmpty>{t('No results found.')}</CommandEmpty>
          </Show>

          <CommandGroup>
            <CommandList>
              <ScrollArea class="h-full" viewPortClassName={'max-h-[200px]'}>
                <Show when={!props.loading}>
                  <For each={filterOptionsIndices()}>
                    {(filterIndex) => {
                      const option = props.options[filterIndex];
                      return (
                        <CommandItem
                          value={String(filterIndex)}
                          onSelect={(currentValue) => {
                            setOpen(false);
                            onSelect(currentValue);
                          }}
                          class={cn(
                            'flex gap-2 flex-col items-start',
                            props.onOptionDelete && 'group/option',
                          )}
                        >
                          <div class="flex gap-2 items-center justify-between w-full">
                            <Show
                              when={option.label === ''}
                              fallback={
                                <Show
                                  when={props.valuesRendering}
                                  fallback={
                                    <span class="truncate">{option.label}</span>
                                  }
                                >
                                  {props.valuesRendering(option.value)}
                                </Show>
                              }
                            >
                              <span class="">&nbsp;</span>
                            </Show>
                            <div class="relative shrink-0 w-4 h-4">
                              <Show when={props.onOptionDelete}>
                                <button
                                  type="button"
                                  class={cn(
                                    'absolute inset-0 flex items-center justify-center text-muted-foreground hover:text-destructive',
                                    'opacity-0 group-hover/option:opacity-100',
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    props.onOptionDelete(option.value);
                                  }}
                                >
                                  <Trash2 class="h-3.5 w-3.5" />
                                </button>
                              </Show>
                              <Check
                                class={cn(
                                  'absolute inset-0 w-4 h-4',
                                  selectedOption()?.value !== option.value
                                    ? 'opacity-0'
                                    : cn(
                                        'opacity-100',
                                        props.onOptionDelete &&
                                          'group-hover/option:opacity-0',
                                      ),
                                )}
                              />
                            </div>
                          </div>
                          <Show when={option.description}>
                            <div class="text-sm text-muted-foreground">
                              {option.description}
                            </div>
                          </Show>
                        </CommandItem>
                      );
                    }}
                  </For>
                </Show>
                <Show when={props.loading}>
                  <CommandItem disabled>{t('Loading...')}</CommandItem>
                </Show>
              </ScrollArea>
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
