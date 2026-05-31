import { CheckIcon, ListFilterIcon } from 'lucide-solid';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type DataTableSelectPopoverProps = {
  title?: string;
  selectedValues: Set<string>;
  options: readonly {
    label: string;
    value: string;
    icon?: any | string;
  }[];
  facets?: Map<any, number>;
  handleFilterChange: (filterValue: string[]) => void;
};

const DataTableSelectPopover = ({
  title,
  selectedValues,
  options,
  handleFilterChange,
  facets,
}: DataTableSelectPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" class="border-dashed">
          <ListFilterIcon class="mr-2 size-4" />
          {title}
          <Show when={selectedValues?.size > 0}>
            <>
              <Separator orientation="vertical" class="mx-2 h-4" />
              <Badge
                variant="accent"
                class="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                <Show
                  when={selectedValues.size > 2}
                  fallback={
                    <>
                      <For
                        each={options.filter((option) =>
                          selectedValues.has(option.value),
                        )}
                      >
                        {(option) => (
                          <Badge
                            variant="accent"
                            class="rounded-sm px-1 font-normal"
                          >
                            {option.label}
                          </Badge>
                        )}
                      </For>
                    </>
                  }
                >
                  <Badge variant="accent" class="rounded-sm px-1 font-normal">
                    {selectedValues.size} selected
                  </Badge>
                </Show>
              </div>
            </>
          </Show>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        class="min-w-[200px] max-w-[250px] break-all p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup>
              <ScrollArea viewPortClassName="max-h-[200px]">
                <For each={options}>
                  {(option, index) => {
                    const isSelected = selectedValues.has(option.value);
                    return (
                      <CommandItem
                        value={option.value}
                        onSelect={() => {
                          if (isSelected) {
                            selectedValues.delete(option.value);
                          } else {
                            selectedValues.add(option.value);
                          }
                          const filterValues = Array.from(selectedValues);
                          handleFilterChange(filterValues);
                        }}
                      >
                        <div
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded border border-secondary',
                            isSelected
                              ? 'bg-secondary text-secondary-foreground'
                              : 'opacity-50 [&_svg]:invisible',
                          )}
                        >
                          <CheckIcon class={cn('h-4 w-4')} />
                        </div>
                        <Show
                          when={typeof option.icon === 'string'}
                          fallback={
                            <Show when={option.icon}>
                              <option.icon class="mr-2 size-4 text-muted-foreground" />
                            </Show>
                          }
                        >
                          <img
                            src={option.icon as string}
                            alt={option.label}
                            className="mr-2 size-4 object-contain"
                          />
                        </Show>
                        <div>
                          <span>{option.label}</span>
                          <span className="hidden">{index()}</span>
                        </div>
                        <Show when={facets?.get(option.value)}>
                          <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
                            {facets.get(option.value)}
                          </span>
                        </Show>
                      </CommandItem>
                    );
                  }}
                </For>
              </ScrollArea>
            </CommandGroup>
            <Show when={selectedValues.size > 0}>
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => handleFilterChange([])}
                    class="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            </Show>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { DataTableSelectPopover };
