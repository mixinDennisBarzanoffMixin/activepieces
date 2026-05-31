import { Template, TemplateType } from '@activepieces/shared';
import { useDebounce } from '@/lib/debounce';
import { createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { LayoutGrid, Search } from 'lucide-solid';
import { createSignal, createMemo } from 'solid-js';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/custom/empty';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { templatesApi } from '../api/templates-api';

import { ExploreTemplateCard } from './explore-template-card';
import { UseTemplateDialog } from './use-template-dialog';

type TemplatesBrowseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TemplateCardSkeleton = () => (
  <div className="h-[250px] rounded-lg border bg-card flex flex-col">
    <div className="p-4 flex flex-col gap-2 flex-1">
      <Skeleton class="h-5 w-3/4" />
      <Skeleton class="h-4 w-full mt-1" />
      <Skeleton class="h-4 w-2/3" />
      <Skeleton class="h-5 w-20 mt-2" />
    </div>
    <div className="h-16 bg-muted/30 rounded-b-lg" />
  </div>
);

export const TemplatesBrowseDialog = ({
  open,
  onOpenChange,
}: TemplatesBrowseDialogProps) => {
  const [search, setSearch] = createSignal('');
  const [selectedCategory, setSelectedCategory] = createSignal('All');
  const [selectedTemplate, setSelectedTemplate] = createSignal<Template | null>(
    null,
  );
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = createSignal(false);

  const [debouncedSearch] = useDebounce(search, 300);

  const { platform } = platformHooks.useCurrentPlatform();
  const isShowingOfficialTemplates = !platform.plan.manageTemplatesEnabled;
  const templateType = isShowingOfficialTemplates
    ? TemplateType.OFFICIAL
    : TemplateType.CUSTOM;

  const { data: categories } = createQuery<string[]>({
    queryKey: ['template', 'categories'],
    queryFn: async () => {
      const result = await templatesApi.getCategories();
      return (result?.value ?? []) as string[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoryParam =
    selectedCategory() !== 'All' ? selectedCategory() : undefined;

  const { data: templates, isLoading } = createQuery<Template[]>({
    queryKey: [
      'templates-browse-dialog',
      templateType,
      debouncedSearch,
      categoryParam,
    ],
    queryFn: async () => {
      const result = await templatesApi.list({
        type: templateType,
        search: debouncedSearch || undefined,
        category: categoryParam,
      });
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const allCategories = createMemo(
    () => ['All', ...(categories || [])],
    [categories],
  );

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setUseTemplateDialogOpen(true);
  };

  const handleUseTemplateDialogClose = (isOpen: boolean) => {
    setUseTemplateDialogOpen(isOpen);
    if (!isOpen) {
      setSelectedTemplate(null);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent class="max-w-5xl w-full h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader class="px-6 pt-6 pb-4 mb-0 flex-shrink-0">
            <DialogTitle>{t('Browse Templates')}</DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-3 flex-shrink-0">
            <div className="relative">
              <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search templates by name or description')}
                value={search()}
                onChange={(e) => setSearch(e.target.value)}
                class="pl-8 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          {isShowingOfficialTemplates && allCategories().length > 1 && (
            <div className="flex-shrink-0 border-t border-b py-2">
              <Carousel
                opts={{ align: 'start', loop: false }}
                class="w-full px-4"
              >
                <CarouselContent class="-ml-2 gap-1">
                  {allCategories().map((category) => {
                    const isSelected = selectedCategory() === category;
                    return (
                      <CarouselItem key={category} class="basis-auto pl-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCategory(category)}
                          class={cn(
                            'px-3 py-1 h-auto whitespace-nowrap transition-colors border-none',
                            isSelected
                              ? 'bg-black text-white hover:!bg-black hover:!text-white'
                              : 'bg-transparent hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground',
                          )}
                        >
                          {category}
                        </Button>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious variant="ghost" class="left-0" />
                <CarouselNext variant="ghost" class="right-0" />
              </Carousel>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <TemplateCardSkeleton key={i} />
                ))}
              </div>
            ) : !templates || templates.length === 0 ? (
              <Empty class="min-h-[300px]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LayoutGrid />
                  </EmptyMedia>
                  <EmptyTitle>{t('No templates found')}</EmptyTitle>
                  <EmptyDescription>
                    {t('Try a different search term or category')}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <ExploreTemplateCard
                    key={template.id}
                    template={template}
                    onTemplateSelect={handleTemplateSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedTemplate() && (
        <UseTemplateDialog
          key={selectedTemplate()!.id}
          template={selectedTemplate()!}
          open={useTemplateDialogOpen()}
          onOpenChange={handleUseTemplateDialogClose}
        />
      )}
    </>
  );
};
