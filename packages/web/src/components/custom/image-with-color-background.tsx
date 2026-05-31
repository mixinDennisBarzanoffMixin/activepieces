import { createSignal } from 'solid-js';

import { Skeleton } from '@/components/ui/skeleton';
import { colorsUtils } from '@/lib/color-utils';
import { cn } from '@/lib/utils';

interface ImageWithColorBackgroundProps extends any {
  fallback?: any;
  border?: boolean;
  roundedCorner?: boolean;
}
const ImageWithColorBackground = ({
  src,
  alt,
  fallback,
  roundedCorner,
  ...props
}: ImageWithColorBackgroundProps) => {
  const [hasError, setHasError] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);
  const [backgroundColor, setBackgroundColor] = createSignal<string | null>(
    null,
  );

  const handleLoad = (e: Event) => {
    setIsLoading(false);
    const img = e.currentTarget as HTMLImageElement;
    colorsUtils.fac
      .getColorAsync(img, { algorithm: 'simple' })
      .then((color) => {
        const [r, g, b] = color.value;
        if (colorsUtils.isGrayColor(r, g, b)) {
          setBackgroundColor(null);
        } else {
          setBackgroundColor(
            `color-mix(in srgb, rgb(${r},${g},${b}) 10%, #fff 92%)`,
          );
        }
      })
      .catch(() => {
        setBackgroundColor(null);
      });
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const { className, border, ...rest } = props;

  return (
    <span
      className={cn('relative inline-block h-full w-full', className, {
        'bg-background': backgroundColor() === null,
        'border border-border/50 dark:bg-foreground/10':
          backgroundColor() === null && border,
        'rounded-lg': roundedCorner,
      })}
      style={
        backgroundColor()
          ? {
              backgroundColor: backgroundColor(),
            }
          : {}
      }
    >
      <Show when={isLoading() && !hasError()}>
        <span className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <Skeleton class="w-full h-full" />}
        </span>
      </Show>
      <Show
        when={!hasError() && src}
        fallback={
          <span className="absolute inset-0 flex items-center justify-center">
            {fallback ?? <Skeleton class="w-full h-full" />}
          </span>
        }
      >
        <img
          src={src}
          alt={alt}
          crossOrigin="anonymous"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            `transition-opacity duration-500 w-full h-full object-contain`,
            {
              'opacity-0': isLoading(),
              'opacity-100': !isLoading(),
            },
          )}
          {...rest}
        />
      </Show>
    </span>
  );
};

export { ImageWithColorBackground };
