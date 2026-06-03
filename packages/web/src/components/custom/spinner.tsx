import { LoaderCircle } from 'lucide-solid';
import { mergeProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export interface ISVGProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  className?: string;
  isLarge?: boolean;
}
/**When editing the size of the spinner use size class */
const LoadingSpinner = (_props: ISVGProps) => {
  const props = mergeProps({ isLarge: false }, _props);
  return (
    <>
      <style>{'@keyframes ap-spin{to{transform:rotate(360deg)}}'}</style>
      <LoaderCircle
        class={cn(
          'animate-spin duration-1500 stroke-foreground size-5',
          {
            'size-[24px]': !props.isLarge,
            'size-[50px]': props.isLarge,
          },
          props.className,
        )}
        style={{ animation: 'ap-spin 1s linear infinite' }}
      />
    </>
  );
};

export { LoadingSpinner };
