import { createSignal } from 'solid-js';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps extends any {
  fallback?: any;
}

const ImageWithFallback = ({
  src,
  alt,
  fallback,
  ...props
}: ImageWithFallbackProps) => {
  const [hasError, setHasError] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const { className, ...rest } = props;

  return (
    <span className={cn('relative inline-block h-full w-full', className)}>
      <Show when={isLoading() && !hasError()}>
        <span className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <Skeleton class="w-full h-full" />}
        </span>
      </Show>
      <Show
        when={!hasError()}
        fallback={
          <span className="absolute inset-0 flex items-center justify-center">
            {fallback ?? <Skeleton class="w-full h-full" />}
          </span>
        }
      >
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            `transition-opacity duration-500 w-full h-full object-contain`,
            {
              'opacity-0': isLoading(),
              'opacity-100': !isLoading(),
            },
            className,
          )}
          {...rest}
        />
      </Show>
    </span>
  );
};

export default ImageWithFallback;
