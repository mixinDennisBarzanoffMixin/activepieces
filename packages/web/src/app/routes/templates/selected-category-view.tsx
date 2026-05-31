import { Template } from '@activepieces/shared';
import { t } from 'i18next';
import { LayoutGrid } from 'lucide-solid';
import { For, Show } from 'solid-js';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/custom/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { ExploreTemplateCard } from '@/features/templates/components/explore-template-card';

import { TemplateCardSkeleton } from './skeletons/template-card-skeleton';

type SelectedCategoryViewSkeletonProps = {
  showCategoryTitle?: boolean;
};

const SelectedCategoryViewSkeleton = ({
  showCategoryTitle = false,
}: SelectedCategoryViewSkeletonProps) => {
  return (
    <div className="space-y-4">
      <Show when={showCategoryTitle}>
        <div className="flex items-center gap-2">
          <Skeleton class="h-8 w-48" />
        </div>
      </Show>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-4">
        <For each={[...Array(6)]}>
          {(_, index) => (
            <TemplateCardSkeleton
              key={index}
              showCategoryCarouselButton={showCategoryTitle}
            />
          )}
        </For>
      </div>
    </div>
  );
};

type SelectedCategoryViewProps = {
  category?: string;
  templates: Template[];
  onTemplateSelect: (template: Template) => void;
  isLoading?: boolean;
  showCategoryTitle?: boolean;
};

export const SelectedCategoryView = ({
  category,
  templates,
  onTemplateSelect,
  isLoading = false,
  showCategoryTitle,
}: SelectedCategoryViewProps) => {
  if (isLoading) {
    return (
      <SelectedCategoryViewSkeleton showCategoryTitle={showCategoryTitle} />
    );
  }

  return (
    <div className="space-y-4">
      <Show when={showCategoryTitle}>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium">{category}</h2>
        </div>
      </Show>

      <Show
        when={templates.length === 0}
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-4">
            <For each={templates}>
              {(template) => (
                <ExploreTemplateCard
                  key={template.id}
                  template={template}
                  onTemplateSelect={onTemplateSelect}
                />
              )}
            </For>
          </div>
        }
      >
        <Empty class="min-h-[300px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutGrid />
            </EmptyMedia>
            <EmptyTitle>{t('Empty category')}</EmptyTitle>
            <EmptyDescription>
              {t('No templates available at the moment')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Show>
    </div>
  );
};
