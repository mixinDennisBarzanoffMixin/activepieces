import { For, mergeProps } from 'solid-js';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';

import { TemplateCardSkeleton } from './template-card-skeleton';

type CategorySectionSkeletonProps = {
  hideHeader?: boolean;
};

export const CategorySectionSkeleton = (
  _props: CategorySectionSkeletonProps,
) => {
  const props = mergeProps({ hideHeader: false }, _props);
  return (
    <div class="space-y-4">
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        class="w-full"
      >
        <div class="flex items-center justify-between mb-4">
          <Skeleton class="h-8 w-48" />
          <div class="flex items-center gap-2">
            <Skeleton class="h-8 w-20" />
            <div class="flex items-center gap-1">
              <Skeleton class="h-8 w-8 rounded-md" />
              <Skeleton class="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>

        <CarouselContent class="pb-3">
          <For each={[0, 1, 2, 3]}>
            {(_, index) => (
              <CarouselItem
                key={index}
                class="basis-full sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 min-w-[350px]"
              >
                <TemplateCardSkeleton
                  showCategoryCarouselButton={props.hideHeader}
                />
              </CarouselItem>
            )}
          </For>
        </CarouselContent>
      </Carousel>
    </div>
  );
};
