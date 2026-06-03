import { mergeProps } from 'solid-js';

import { LoadingSpinner } from '@/components/custom/spinner';
import { cn } from '@/lib/utils';

type LoadingScreenProps = {
  brightSpinner?: boolean;
  mode?: 'fullscreen' | 'container';
};
export const LoadingScreen = (_props: LoadingScreenProps) => {
  const props = mergeProps(
    { brightSpinner: false, mode: 'fullscreen' },
    _props,
  );
  return (
    <div
      class={cn('flex h-screen w-screen items-center justify-center', {
        'h-full w-full': props.mode === 'container',
      })}
    >
      <LoadingSpinner
        classlist={{
          'stroke-background!': props.brightSpinner,
        }}
        isLarge={true}
      />
    </div>
  );
};
