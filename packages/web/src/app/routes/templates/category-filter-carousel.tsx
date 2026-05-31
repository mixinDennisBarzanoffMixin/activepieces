import { ChevronLeft, ChevronRight } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '@/components/ui/carousel';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

type CategoryFilterCarouselProps = {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  className?: string;
};

const CarouselContentWithButtons = ({
  className,
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  const { canScrollNext, canScrollPrev } = useCarousel();

  return (
    <div
      className={`relative my-4 transition-[padding] duration-200 py-3 border-b border-t `}
      style={{
        paddingLeft: canScrollPrev ? '3rem' : '0',
        paddingRight: canScrollNext ? '3rem' : '0',
      }}
    >
      <CarouselContent class={cn('-ml-2 gap-1', className)}>
        <For each={categories}>
          {(category) => {
            const isSelected = selectedCategory === category;
            return (
              <CarouselItem key={category} class="basis-auto pl-2">
                <Button
                  variant="outline"
                  onClick={() => onCategorySelect(category)}
                  class={`px-4 py-1.5 h-auto whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-black text-white border-black hover:!bg-black hover:!text-white'
                      : 'bg-transparent hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground border-none'
                  }`}
                >
                  {category}
                </Button>
              </CarouselItem>
            );
          }}
        </For>
      </CarouselContent>
      <Show when={canScrollPrev}>
        <CarouselPrevious variant="ghost" class="left-0 z-10">
          <ChevronLeft class="h-4 w-4" />
        </CarouselPrevious>
      </Show>
      <Show when={canScrollNext}>
        <CarouselNext variant="ghost" class="right-0 z-10">
          <ChevronRight class="h-4 w-4" />
        </CarouselNext>
      </Show>
    </div>
  );
};

export const CategoryFilterCarousel = ({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: false,
      }}
      class="w-full"
    >
      <CarouselContentWithButtons
        class={DASHBOARD_CONTENT_PADDING_X}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={onCategorySelect}
      />
    </Carousel>
  );
};
