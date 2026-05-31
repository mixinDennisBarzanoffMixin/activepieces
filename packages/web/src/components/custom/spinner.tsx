import { LoaderCircle } from 'lucide-solid';

import { cn } from '@/lib/utils';

export interface ISVGProps extends any {
  className?: string;
  isLarge?: boolean;
}
/**When editing the size of the spinner use size class */
const LoadingSpinner = ({ className, isLarge = false }: ISVGProps) => {
  return (
    <LoaderCircle
      class={cn(
        'animate-spin  duration-1500 stroke-foreground size-5',
        {
          'size-[24px]': !isLarge,
          'size-[50px]': isLarge,
        },
        className,
      )}
    />
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';
export { LoadingSpinner };
