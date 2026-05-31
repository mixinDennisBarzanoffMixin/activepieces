import { useDebouncedCallback } from '@/lib/debounce';
import { t } from 'i18next';
import { SearchIcon } from 'lucide-solid';
import { createSignal } from 'solid-js';

import { SearchInput } from '@/components/custom/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

const DEBOUNCE_MS = 500;

type DataTableInputPopoverProps = {
  title?: string;
  filterValue: string;
  handleFilterChange: (filterValue: string) => void;
};

const DataTableInputPopover = ({
  title,
  filterValue,
  handleFilterChange,
}: DataTableInputPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" class="border-dashed">
          <SearchIcon class="mr-2 size-4" />
          {title}
          <Show when={filterValue.length > 0}>
            <>
              <Separator orientation="vertical" class="mx-2 h-4" />
              <Badge
                variant="accent"
                class="rounded-sm px-1 font-normal max-w-40 truncate"
              >
                {filterValue}
              </Badge>
            </>
          </Show>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[200px] p-0" align="start">
        <SearchPopoverContent
          key={filterValue}
          filterValue={filterValue}
          handleFilterChange={handleFilterChange}
        ></SearchPopoverContent>
      </PopoverContent>
    </Popover>
  );
};

const SearchPopoverContent = ({
  filterValue,
  handleFilterChange,
}: Pick<DataTableInputPopoverProps, 'filterValue' | 'handleFilterChange'>) => {
  const [searchQuery, setSearchQuery] = createSignal(filterValue);
  const debouncedFilterChange = useDebouncedCallback(
    handleFilterChange,
    DEBOUNCE_MS,
  );

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedFilterChange(value);
  };

  return (
    <SearchInput
      key={filterValue}
      placeholder={t('Search')}
      value={searchQuery()}
      onChange={onSearchChange}
    />
  );
};
export { DataTableInputPopover };
