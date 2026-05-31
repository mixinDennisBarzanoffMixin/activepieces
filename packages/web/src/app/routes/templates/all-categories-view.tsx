import { Template } from '@activepieces/shared';
import { createEffect, createSignal, For, Show } from 'solid-js';

import { CategorySection } from './category-section';
import { CategorySectionSkeleton } from './skeletons/category-section-skeleton';

type AllCategoriesViewSkeletonProps = {
  hideHeader?: boolean;
};

const AllCategoriesViewSkeleton = ({
  hideHeader = false,
}: AllCategoriesViewSkeletonProps) => {
  return (
    <div className="space-y-6">
      <For each={[...Array(4)]}>
        {(_, index) => (
          <CategorySectionSkeleton key={index} hideHeader={hideHeader} />
        )}
      </For>
    </div>
  );
};

function LazyCategorySection({
  category,
  templates,
  onCategorySelect,
  onTemplateSelect,
}: {
  category: string;
  templates: Template[];
  onCategorySelect: (category: string) => void;
  onTemplateSelect: (template: Template) => void;
}) {
  let ref = null;
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
    <div ref={(el) => (ref = el)}>
      <Show when={isVisible} fallback={<CategorySectionSkeleton />}>
        <CategorySection
          category={category}
          templates={templates}
          onCategorySelect={onCategorySelect}
          onTemplateSelect={onTemplateSelect}
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

export const AllCategoriesView = ({
  templatesByCategory,
  categories,
  onCategorySelect,
  onTemplateSelect,
  isLoading = false,
  hideHeader = false,
}: AllCategoriesViewProps) => {
  const stableOnCategorySelect = onCategorySelect;
  const stableOnTemplateSelect = onTemplateSelect;

  if (isLoading) {
    return <AllCategoriesViewSkeleton hideHeader={hideHeader} />;
  }

  return (
    <div className="space-y-6">
      <For each={categories}>
        {(category) => {
          const categoryTemplates = templatesByCategory[category];

          return (
            <LazyCategorySection
              key={category}
              category={category}
              templates={categoryTemplates}
              onCategorySelect={stableOnCategorySelect}
              onTemplateSelect={stableOnTemplateSelect}
            />
          );
        }}
      </For>
    </div>
  );
};
