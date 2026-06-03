import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const StepOutputSkeleton = (props: { className?: string }) => {
  return (
    <div class={cn('flex  w-full  h-full  px-4', props.className)}>
      <div class="space-y-2 grow">
        <div class="flex items-center gap-2">
          <Skeleton class="w-40 h-4" />
        </div>
        <Skeleton class="w-full h-40" />
      </div>
    </div>
  );
};
export { StepOutputSkeleton };
