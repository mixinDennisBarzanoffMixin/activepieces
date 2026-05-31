import { t } from 'i18next';
import { SearchX } from 'lucide-solid';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/custom/empty';

export const EmptyTemplatesView = () => {
  return (
    <Empty class="min-h-[300px]">
      <EmptyHeader class="max-w-xl">
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>{t('No templates found')}</EmptyTitle>
        <EmptyDescription>
          {t(
            'No templates match your search criteria. Try adjusting your search terms.',
          )}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
