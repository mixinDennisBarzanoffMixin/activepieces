import { t } from 'i18next';
import { Check } from 'lucide-solid';
import { Show, For, type JSX } from 'solid-js';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Props<T extends string> = {
  selectedValue: T;
  onSelectedValueChange: (value: T) => void;
  items: { value: T; label: string }[];
  children: JSX.Element;
  className?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  listRef?: HTMLDivElement;
};

export function AutoComplete<T extends string>(props: Props<T>) {
  const onSelectItem = (inputValue: string) => {
    const item = props.items.find((item) => item.value === inputValue);
    if (item) {
      props.onSelectedValueChange(item.value);
      props.setOpen(false);
    }
  };

  return (
    <div class="flex items-center">
      <Popover
        open={props.open}
        onOpenChange={(open) => {
          props.setOpen(open);
        }}
      >
        <PopoverTrigger asChild>{props.children}</PopoverTrigger>

        <PopoverContent
          asChild
          onOpenAutoFocus={(e: Event) => e.preventDefault()}
          onInteractOutside={(e: Event) => {
            if (
              e.target instanceof Element &&
              e.target.hasAttribute('cmdk-input')
            ) {
              e.preventDefault();
            }
          }}
          class="w-(--radix-popover-trigger-width) p-0"
        >
          <Command class={props.className} ref={props.listRef}>
            <CommandList class="bg-background">
              <ScrollArea
                class={cn('', {
                  'h-50': props.items.length >= 5,
                  'h-10': props.items.length === 1,
                  'h-20': props.items.length === 2,
                  'h-30': props.items.length === 3,
                  'h-40': props.items.length === 4,
                })}
              >
                <Show
                  when={props.items.length > 0}
                  fallback={<CommandEmpty>{t('No items')}</CommandEmpty>}
                >
                  <CommandGroup>
                    <For each={props.items}>
                      {(option) => (
                        <CommandItem
                          value={option.value}
                          onMouseDown={(e) => e.preventDefault()}
                          onSelect={onSelectItem}
                        >
                          <Check
                            class={cn(
                              'h-4 w-4',
                              props.selectedValue === option.value
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      )}
                    </For>
                  </CommandGroup>
                </Show>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
