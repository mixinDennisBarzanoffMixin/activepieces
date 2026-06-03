import { Template } from '@activepieces/shared';
import { t } from 'i18next';
import { LayoutGrid } from 'lucide-solid';
import { For, mergeProps, Show } from 'solid-js';

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

const SelectedCategoryViewSkeleton = (
  _props: SelectedCategoryViewSkeletonProps,
) => {
  const props = mergeProps({ showCategoryTitle: false }, _props);
  return (
    <div class="space-y-4">
      <Show when={props.showCategoryTitle}>
        <div class="flex items-center gap-2">
          <Skeleton class="h-8 w-48" />
        </div>
      </Show>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-4">
        <For each={Array.from({ length: 6 })}>
          {(_, index) => (
            <TemplateCardSkeleton
              key={index}
              showCategoryCarouselButton={props.showCategoryTitle}
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

export const SelectedCategoryView = (_props: SelectedCategoryViewProps) => {
  const props = mergeProps({ isLoading: false }, _props);

  return (
    <Show
      when={!props.isLoading}
      fallback={
        <SelectedCategoryViewSkeleton
          showCategoryTitle={props.showCategoryTitle}
        />
      }
    >
      <div class="space-y-4">
        <Show when={props.showCategoryTitle}>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-medium">{props.category}</h2>
          </div>
        </Show>

        <Show
          when={props.templates.length === 0}
          fallback={
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-4">
              <For each={props.templates}>
                {(template) => (
                  <ExploreTemplateCard
                    template={template}
                    onTemplateSelect={props.onTemplateSelect}
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
    </Show>
  );
};
