import { Template } from '@activepieces/shared';
import { createEffect, createSignal, For, mergeProps, Show } from 'solid-js';

import { CategorySection } from './category-section';
import { CategorySectionSkeleton } from './skeletons/category-section-skeleton';

type AllCategoriesViewSkeletonProps = {
  hideHeader?: boolean;
};

const AllCategoriesViewSkeleton = (_props: AllCategoriesViewSkeletonProps) => {
  const props = mergeProps({ hideHeader: false }, _props);
  return (
    <div class="space-y-6">
      <For each={Array.from({ length: 4 })}>
        {(_, index) => (
          <CategorySectionSkeleton key={index} hideHeader={props.hideHeader} />
        )}
      </For>
    </div>
  );
};

function LazyCategorySection(props: {
  category: string;
  templates: Template[];
  onCategorySelect: (category: string) => void;
  onTemplateSelect: (template: Template) => void;
}) {
  let ref: HTMLDivElement | undefined;
  const [isVisible, setIsVisible] = createSignal(false);

  createEffect(() => {
    const el = ref;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  });

  return (
    <div ref={ref}>
      <Show when={isVisible} fallback={<CategorySectionSkeleton />}>
        <CategorySection
          category={props.category}
          templates={props.templates}
          onCategorySelect={props.onCategorySelect}
          onTemplateSelect={props.onTemplateSelect}
        />
      </Show>
    </div>
  );
}

type AllCategoriesViewProps = {
  templatesByCategory: Record<string, Template[]>;
  categories: string[];
  onCategorySelect: (category: string) => void;
  onTemplateSelect: (template: Template) => void;
  isLoading?: boolean;
  hideHeader?: boolean;
};

export const AllCategoriesView = (_props: AllCategoriesViewProps) => {
  const props = mergeProps({ isLoading: false, hideHeader: false }, _props);

  return (
    <Show
      when={!props.isLoading}
      fallback={<AllCategoriesViewSkeleton hideHeader={props.hideHeader} />}
    >
      <div class="space-y-6">
        <For each={props.categories}>
          {(category) => (
            <LazyCategorySection
              category={category}
              templates={props.templatesByCategory[category]}
              onCategorySelect={props.onCategorySelect}
              onTemplateSelect={props.onTemplateSelect}
            />
          )}
        </For>
      </div>
    </Show>
  );
};
