import { Template } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import { For } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ExploreTemplateCard } from '@/features/templates/components/explore-template-card';

type CategorySectionProps = {
  category: string;
  templates: Template[];
  onCategorySelect: (category: string) => void;
  onTemplateSelect: (template: Template) => void;
};

export const CategorySection = ({
  category,
  templates,
  onCategorySelect,
  onTemplateSelect,
}: CategorySectionProps) => {
    if (!templates || templates.length === 0) return null;

    return (
      <div className="space-y-4">
        <Carousel
          opts={{
            align: 'start',
            loop: false,
            slidesToScroll: 'auto',
          }}
          class="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">{category}</h2>
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => onCategorySelect(category)}
                class="flex items-center"
              >
                {t('View all')}
              </Button>
              <div className="flex items-center">
                <CarouselPrevious
                  variant="ghost"
                  class="static translate-y-0 h-8 w-8"
                >
                  <ChevronLeft class="h-4 w-4" />
                </CarouselPrevious>
                <CarouselNext
                  variant="ghost"
                  class="static translate-y-0 h-8 w-8"
                >
                  <ChevronRight class="h-4 w-4" />
                </CarouselNext>
              </div>
            </div>
          </div>

          <CarouselContent class="pb-3">
            <For each={templates}>
              {(template) => (
                <CarouselItem
                  key={template.id}
                  class="basis-full sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 min-w-[320px]"
                >
                  <ExploreTemplateCard
                    template={template}
                    onTemplateSelect={onTemplateSelect}
                  />
                </CarouselItem>
              )}
            </For>
          </CarouselContent>
        </Carousel>
      </div>
    );
};

CategorySection.displayName = 'CategorySection';
