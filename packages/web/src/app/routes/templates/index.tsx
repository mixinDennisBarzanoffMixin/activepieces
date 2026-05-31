import {
  Template,
  TemplateTelemetryEventType,
  TemplateType,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import { Plus } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';

import { PageHeader } from '@/components/custom/page-header';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows';
import { templatesTelemetryApi, templatesHooks } from '@/features/templates';
import { platformHooks } from '@/hooks/platform-hooks';
import { DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { AllCategoriesView } from './all-categories-view';
import { CategoryFilterCarousel } from './category-filter-carousel';
import { EmptyTemplatesView } from './empty-templates-view';
import { SelectedCategoryView } from './selected-category-view';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { data: templateCategories } = templatesHooks.useTemplateCategories();
  const { platform } = platformHooks.useCurrentPlatform();
  const isShowingOfficialTemplates = !platform.plan.manageTemplatesEnabled;
  const { templates, isLoading, search, setSearch, category, setCategory } =
    templatesHooks.useTemplates(
      isShowingOfficialTemplates ? TemplateType.OFFICIAL : TemplateType.CUSTOM,
    );
  const selectedCategory = category as string;
  const { data: allOfficialTemplates, isLoading: isAllTemplatesLoading } =
    templatesHooks.useAllOfficialTemplates();
  const { mutate: createFlow, isPending: isCreateFlowPending } =
    flowHooks.useStartFromScratch(UncategorizedFolderId);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleTemplateSelect = (template: Template) => {
    navigate(`/templates/${template.id}`);
    if (template.type === TemplateType.OFFICIAL) {
      templatesTelemetryApi.sendEvent({
        eventType: TemplateTelemetryEventType.VIEW,
        templateId: template.id,
      });
    }
  };

  const templatesByCategory = createMemo(() => {
    const grouped: Record<string, Template[]> = {} as Record<
      string,
      Template[]
    >;

    if (isShowingOfficialTemplates) {
      allOfficialTemplates?.forEach((template: Template) => {
        if (template.categories?.length) {
          template.categories?.forEach((category: string) => {
            if (!grouped[category]) {
              grouped[category] = [];
            }
            grouped[category].push(template);
          });
        }
      });
    }

    return grouped;
  });

  const categories = createMemo(() => {
    return ['All', ...(templateCategories || [])];
  });

  const selectedCategoryTemplates = createMemo(() => {
    if (selectedCategory === 'All') {
      return templates || [];
    }
    return templatesByCategory[selectedCategory] || [];
  });

  const showLoading =
    isLoading || (isShowingOfficialTemplates && isAllTemplatesLoading);
  const showAllCategories =
    isShowingOfficialTemplates && selectedCategory === 'All';
  const hasTemplates = templates && templates.length > 0;
  const showCategoryTitleForOfficialTemplates =
    isShowingOfficialTemplates && selectedCategory !== 'All';

  return (
    <div>
      <div>
        <div className="sticky top-0 z-10 bg-background">
          <PageHeader
            showSidebarToggle={true}
            class="static"
            title={
              <>
                <div className="flex flex-row w-full justify-between gap-1">
                  <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder={t('Search templates by name or description')}
                  ></SearchInput>
                  <div className="flex flex-row justify-end w-[50%]">
                    <Button
                      variant="outline"
                      class="gap-2 h-full"
                      onClick={() => createFlow()}
                      disabled={isCreateFlowPending}
                    >
                      <Plus class="w-4 h-4" />
                      {t('Start from scratch')}
                    </Button>
                  </div>
                </div>
              </>
            }
          ></PageHeader>

          <Show when={isShowingOfficialTemplates && categories}>
            <CategoryFilterCarousel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setCategory}
            />
          </Show>
        </div>
        <div className={DASHBOARD_CONTENT_PADDING_X}>
          <Show
            when={!hasTemplates && !showLoading}
            fallback={
              <Show
                when={showAllCategories}
                fallback={
                  <SelectedCategoryView
                    category={selectedCategory}
                    templates={selectedCategoryTemplates}
                    onTemplateSelect={handleTemplateSelect}
                    isLoading={showLoading}
                    showCategoryTitle={showCategoryTitleForOfficialTemplates}
                  />
                }
              >
                <AllCategoriesView
                  templatesByCategory={templatesByCategory}
                  categories={categories}
                  onCategorySelect={setCategory}
                  onTemplateSelect={handleTemplateSelect}
                  isLoading={showLoading}
                  hideHeader={!isShowingOfficialTemplates}
                />
              </Show>
            }
          >
            <EmptyTemplatesView />
          </Show>
        </div>
      </div>
    </div>
  );
};

export { TemplatesPage };
