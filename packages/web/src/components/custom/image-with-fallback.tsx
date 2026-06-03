import { createSignal, Show, splitProps, type JSX } from 'solid-js';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps
  extends Omit<JSX.IntrinsicElements['img'], 'alt' | 'className' | 'src'> {
  alt?: string;
  className?: string;
  fallback?: JSX.Element;
  src?: string;
}

const ImageWithFallback = (_props: ImageWithFallbackProps) => {
  const split = splitProps(_props, ['src', 'alt', 'fallback', 'className']);
  const props = split[0];
  const rest = split[1];
  const [hasError, setHasError] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <span class={cn('relative inline-block h-full w-full', props.className)}>
      <Show when={isLoading() && !hasError()}>
        <span class="absolute inset-0 flex items-center justify-center">
          {props.fallback ?? <Skeleton class="w-full h-full" />}
        </span>
      </Show>
      <Show
        when={!hasError()}
        fallback={
          <span class="absolute inset-0 flex items-center justify-center">
            {props.fallback ?? <Skeleton class="w-full h-full" />}
          </span>
        }
      >
        <img
          src={props.src}
          alt={props.alt}
          onLoad={handleLoad}
          onError={handleError}
          class={cn(
            'transition-opacity duration-500 w-full h-full object-contain',
            {
              'opacity-0': isLoading(),
              'opacity-100': !isLoading(),
            },
            props.className,
          )}
          {...rest}
        />
      </Show>
    </span>
  );
};

export default ImageWithFallback;
