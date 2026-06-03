import { mergeProps, Show } from 'solid-js';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type TemplateCardSkeletonProps = {
  showCategoryCarouselButton?: boolean;
};

export const TemplateCardSkeleton = (_props: TemplateCardSkeletonProps) => {
  const props = mergeProps({ showCategoryCarouselButton: false }, _props);
  return (
    <Card class="h-[250px] w-full flex flex-col">
      <CardContent class="py-5 px-4 flex flex-col gap-1 flex-1 min-h-0">
        <Show when={props.showCategoryCarouselButton}>
          <div class="h-12 flex flex-col gap-2 flex-shrink-0">
            <Skeleton class="h-5 w-full" />
            <Skeleton class="h-5 w-3/4" />
          </div>
        </Show>

        <div class="flex flex-col gap-2 mt-1 flex-shrink-0">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-5/6" />
        </div>

        <div class="h-8 flex gap-2 mt-1 flex-shrink-0">
          <Skeleton class="h-6 w-20" />
          <Skeleton class="h-6 w-24" />
        </div>
      </CardContent>

      <div class="h-16 flex items-center px-4 rounded-b-lg">
        <Skeleton class="h-8 w-8 rounded-full" />
        <Skeleton class="h-8 w-8 rounded-full ml-2" />
        <Skeleton class="h-8 w-8 rounded-full ml-2" />
        <Skeleton class="h-8 w-8 rounded-full ml-2" />
      </div>
    </Card>
  );
};
