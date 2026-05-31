import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { Check, ChevronsUpDown, RefreshCcw, Trash2, X } from 'lucide-solid';
import { createSignal } from 'solid-js';

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
    open: boolean;
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
  open: boolean;
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
export const SearchableSelect = <T,>({
  options,
  onChange,
  value,
  placeholder,
  disabled,
  loading,
  showDeselect,
  onRefresh,
  showRefresh,
  onClose,
  triggerClassName,
  valuesRendering,
  openState: openStateInitializer,
  refreshOnSearch,
  cachedOptions = [],
  onOptionDelete,
}: SearchableSelectProps<T>) => {
  let triggerRef: HTMLButtonElement | undefined;
  const [searchTerm, setSearchTerm] = createSignal('');
  const { open, setOpen } = useOpenState(openStateInitializer);
  const triggerWidth = `${triggerRef?.clientWidth ?? 0}px`;
  const selectedOption =
    [...cachedOptions, ...options].find((option) =>
      deepEqual(option.value, value),
    ) ?? undefined;
  const filterOptionsIndices = options
    .map((option, index) => {
      return {
        label: option.label,
        value: option.value,
        index: index,
        description: option.description ?? '',
      };
    })
    .filter((option) => {
      if (refreshOnSearch || searchTerm().length === 0) {
        return true;
      }
      return (
        option.label.toLowerCase().includes(searchTerm().toLowerCase()) ||
        option.description.toLowerCase().includes(searchTerm().toLowerCase())
      );
    })
    .map((option) => option.index);

  const onSelect = (index: string) => {
    const optionIndex =
      Number.isInteger(parseInt(index)) && !Number.isNaN(parseInt(index))
        ? parseInt(index)
        : -1;
    setSearchTerm('');

    if (optionIndex === -1) {
      return;
    }
    const option = options[optionIndex];
    onChange(option.value);
  };
  return (
    <Popover
      modal={true}
      open={open()}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
        if (refreshOnSearch && searchTerm().length > 0) {
          refreshOnSearch('');
          setSearchTerm('');
        }
        setOpen(open);
      }}
    >
      <PopoverTrigger
        asChild
        class={cn({
          'cursor-not-allowed opacity-80 ': disabled,
        })}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
          }
          e.stopPropagation();
        }}
      >
        <div className="relative">
          <Button
            ref={(el) => (triggerRef = el)}
            variant="outline"
            disabled={disabled}
            role="combobox"
            loading={loading}
            aria-expanded={open()}
            class={cn('w-full justify-between', triggerClassName)}
            onClick={(e) => {
              setOpen(!open());
              e.preventDefault();
            }}
          >
            <span className="flex w-full truncate select-none">
              {selectedOption
                ? valuesRendering
                  ? valuesRendering(selectedOption.value)
                  : selectedOption.label
                : placeholder}
            </span>
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          <div className="right-10 top-2 absolute flex gap-2  z-50 items-center">
            <Show
              when={showDeselect && !disabled && selectedOption && !loading}
            >
              <SelectUtilButton
                tooltipText={t('Unset')}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange(null);
                }}
                Icon={X}
              ></SelectUtilButton>
            </Show>
            <Show when={showRefresh && !loading}>
              <SelectUtilButton
                tooltipText={t('Refresh')}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onRefresh) {
                    onRefresh();
                  }
                }}
                Icon={RefreshCcw}
              ></SelectUtilButton>
            </Show>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        style={{
          maxWidth: triggerWidth,
          minWidth: triggerWidth,
        }}
        class="min-w-full w-full p-0"
      >
        <Command class="w-full" shouldFilter={false}>
          <CommandInput
            placeholder={t(placeholder)}
            value={searchTerm()}
            onValueChange={(e) => {
              setSearchTerm(e);
              if (refreshOnSearch) {
                refreshOnSearch(e);
              }
            }}
          />
          <Show when={filterOptionsIndices.length === 0}>
            <CommandEmpty>{t('No results found.')}</CommandEmpty>
          </Show>

          <CommandGroup>
            <CommandList>
              <ScrollArea class="h-full" viewPortClassName={'max-h-[200px]'}>
                <Show when={filterOptionsIndices && !loading}>
                  <For each={filterOptionsIndices}>
                    {(filterIndex) => {
                      const option = options[filterIndex];
                      if (!option) {
                        return null;
                      }
                      return (
                        <CommandItem
                          value={String(filterIndex)}
                          onSelect={(currentValue) => {
                            setOpen(false);
                            onSelect(currentValue);
                          }}
                          class={cn(
                            'flex gap-2 flex-col items-start',
                            onOptionDelete && 'group/option',
                          )}
                        >
                          <div className="flex gap-2 items-center justify-between w-full">
                            <Show
                              when={option.label === ''}
                              fallback={
                                <Show
                                  when={valuesRendering}
                                  fallback={
                                    <span className="truncate">
                                      {option.label}
                                    </span>
                                  }
                                >
                                  {valuesRendering(option.value)}
                                </Show>
                              }
                            >
                              <span className="">&nbsp;</span>
                            </Show>
                            <div className="relative shrink-0 w-4 h-4">
                              <Show when={onOptionDelete}>
                                <button
                                  type="button"
                                  className={cn(
                                    'absolute inset-0 flex items-center justify-center text-muted-foreground hover:text-destructive',
                                    'opacity-0 group-hover/option:opacity-100',
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onOptionDelete(option.value);
                                  }}
                                >
                                  <Trash2 class="h-3.5 w-3.5" />
                                </button>
                              </Show>
                              <Check
                                class={cn(
                                  'absolute inset-0 w-4 h-4',
                                  selectedOption?.value !== option.value
                                    ? 'opacity-0'
                                    : cn(
                                        'opacity-100',
                                        onOptionDelete &&
                                          'group-hover/option:opacity-0',
                                      ),
                                )}
                              />
                            </div>
                          </div>
                          <Show when={option.description}>
                            <div className="text-sm text-muted-foreground">
                              {option.description}
                            </div>
                          </Show>
                        </CommandItem>
                      );
                    }}
                  </For>
                </Show>
                <Show when={loading}>
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

SearchableSelect.displayName = 'SearchableSelect';
