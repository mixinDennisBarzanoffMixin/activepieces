import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const StepOutputSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex  w-full  h-full  px-4', className)}>
      <div className="space-y-2 grow">
        <div className="flex items-center gap-2">
          <Skeleton class="w-40 h-4" />
        </div>
        <Skeleton class="w-full h-40" />
      </div>
    </div>
  );
};
export { StepOutputSkeleton };
