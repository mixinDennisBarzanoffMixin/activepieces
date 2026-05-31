import { For } from 'solid-js';
import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from "lucide-solid";

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PAGE_SIZE_OPTIONS } from '../lib/utils';

type AutomationsPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export const AutomationsPagination = ({
  currentPage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
}: AutomationsPaginationProps) => {
  const maxPages = Math.max(totalPages, 1);

  return (
    <div class="flex items-center justify-end gap-4 px-2 py-4 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground">{t('Rows per page')}</span>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => onPageSizeChange(Number(val))}
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <For each={PAGE_SIZE_OPTIONS}>{(size) => <SelectItem value={String(size)}>
                {size}
              </SelectItem>}</For>
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevPage}
        disabled={currentPage === 0}
        class="gap-1"
      >
        <ChevronLeft class="h-4 w-4" />
        {t('Previous')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onNextPage}
        disabled={currentPage >= maxPages - 1}
        class="gap-1"
      >
        {t('Next')}
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  );
};
