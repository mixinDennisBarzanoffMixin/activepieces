import { t } from 'i18next';
import { Search } from 'lucide-solid';
import {
  For,
  createMemo,
  createSignal,
  mergeProps,
  type JSX,
  Show,
} from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

type MultiSelectFilterProps = {
  label: string;
  icon: JSX.Element;
  options: MultiSelectOption[];
  selectedValues: string[];
  onInput: (values: string[]) => void;
  searchable?: boolean;
};

export const MultiSelectFilter = (_props: MultiSelectFilterProps) => {
  const props = mergeProps({ searchable: false }, _props);
  const [open, setOpen] = createSignal(false);
  const [search, setSearch] = createSignal('');

  const toggleValue = (value: string) => {
    if (props.selectedValues.includes(value)) {
      props.onInput(props.selectedValues.filter((v) => v !== value));
      return;
    }
    props.onInput([...props.selectedValues, value]);
  };

  const selectedLabels = createMemo(() =>
    props.selectedValues
      .map((value) => props.options.find((option) => option.value === value))
      .filter((option): option is MultiSelectOption => option !== undefined),
  );

  const filteredOptions = createMemo(() =>
    props.searchable && search()
      ? props.options.filter((o) =>
          o.label.toLowerCase().includes(search().toLowerCase()),
        )
      : props.options,
  );

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          class="text-sm gap-2 whitespace-nowrap border-dashed"
        >
          {props.icon}
          <span>{props.label}</span>
          <Show when={props.selectedValues.length > 0}>
            <div class="flex items-center gap-1 ml-1">
              <div class="h-4 w-px bg-border" />
              <Show
                when={props.selectedValues.length <= 2}
                fallback={
                  <Badge
                    variant="outline"
                    class="px-1.5 py-0 text-xs font-normal rounded-sm bg-muted"
                  >
                    {props.selectedValues.length} selected
                  </Badge>
                }
              >
                <For each={selectedLabels()}>
                  {(option) => (
                    <Badge
                      variant="outline"
                      class="px-1.5 py-0 text-xs font-normal rounded-sm bg-muted"
                    >
                      {option.label}
                    </Badge>
                  )}
                </For>
              </Show>
            </div>
          </Show>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-56 p-0" align="start">
        <Show when={props.searchable}>
          <div class="px-2 pt-2 pb-1 border-b">
            <div class="relative">
              <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('Search...')}
                value={search}
                onInput={(e) => setSearch(e.currentTarget.value)}
                class="h-8 pl-7 text-sm border-none shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        </Show>
        <ScrollArea class="max-h-[300px]">
          <div class="p-2 space-y-1">
            <Show
              when={filteredOptions().length === 0}
              fallback={
                <For each={filteredOptions()}>
                  {(option) => (
                    <div
                      class="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                      onClick={() => toggleValue(option.value)}
                    >
                      <Checkbox
                        checked={props.selectedValues.includes(option.value)}
                        onCheckedChange={() => toggleValue(option.value)}
                      />
                      {option.icon}
                      <span class="text-sm flex-1 truncate">
                        {option.label}
                      </span>
                    </div>
                  )}
                </For>
              }
            >
              <div class="px-2 py-4 text-sm text-center text-muted-foreground">
                {t('No results')}
              </div>
            </Show>
          </div>
        </ScrollArea>
        <Show when={props.selectedValues.length > 0}>
          <div class="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              class="w-full"
              onClick={() => props.onInput([])}
            >
              {t('Clear all')}
            </Button>
          </div>
        </Show>
      </PopoverContent>
    </Popover>
  );
};

export type MultiSelectOption = {
  value: string;
  label: string;
  icon?: JSX.Element;
};
