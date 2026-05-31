import { createSignal } from 'solid-js';
import { t } from 'i18next';
import { Search } from "lucide-solid";

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
  icon;
  options: { value: string; label: string; icon? }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
};

export const MultiSelectFilter = ({
  label,
  icon,
  options,
  selectedValues,
  onChange,
  searchable = false,
}: MultiSelectFilterProps) => {
  const [open, setOpen] = createSignal(false);
  const [search, setSearch] = createSignal('');

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectedLabels = selectedValues
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  const filteredOptions =
    searchable && search
      ? options.filter((o) =>
          o.label.toLowerCase().includes(search.toLowerCase()),
        )
      : options;

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
          {icon}
          <span>{label}</span>
          {selectedValues.length > 0 && (
            <div class="flex items-center gap-1 ml-1">
              <div class="h-4 w-px bg-border" />
              {selectedValues.length <= 2 ? (
                selectedLabels.map((labelText, idx) => (
                  <Badge
                    key={selectedValues[idx]}
                    variant="outline"
                    class="px-1.5 py-0 text-xs font-normal rounded-sm bg-muted"
                  >
                    {labelText}
                  </Badge>
                ))
              ) : (
                <Badge
                  variant="outline"
                  class="px-1.5 py-0 text-xs font-normal rounded-sm bg-muted"
                >
                  {selectedValues.length} selected
                </Badge>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-56 p-0" align="start">
        {searchable && (
          <div class="px-2 pt-2 pb-1 border-b">
            <div class="relative">
              <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('Search...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                class="h-8 pl-7 text-sm border-none shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        )}
        <ScrollArea class="max-h-[300px]">
          <div class="p-2 space-y-1">
            {filteredOptions.length === 0 ? (
              <div class="px-2 py-4 text-sm text-center text-muted-foreground">
                {t('No results')}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  class="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                  onClick={() => toggleValue(option.value)}
                >
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={() => toggleValue(option.value)}
                  />
                  {option.icon}
                  <span class="text-sm flex-1 truncate">
                    {option.label}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {selectedValues.length > 0 && (
          <div class="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              class="w-full"
              onClick={() => onChange([])}
            >
              {t('Clear all')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
