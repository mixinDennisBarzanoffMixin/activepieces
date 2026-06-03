import { createSignal, Show, splitProps, type JSX } from 'solid-js';

import { Skeleton } from '@/components/ui/skeleton';
import { colorsUtils } from '@/lib/color-utils';
import { cn } from '@/lib/utils';

interface ImageWithColorBackgroundProps
  extends Omit<JSX.IntrinsicElements['img'], 'alt' | 'className' | 'src'> {
  alt?: string;
  border?: boolean;
  className?: string;
  fallback?: JSX.Element;
  roundedCorner?: boolean;
  src?: string;
}
const ImageWithColorBackground = (_props: ImageWithColorBackgroundProps) => {
  const split = splitProps(_props, [
    'src',
    'alt',
    'fallback',
    'roundedCorner',
    'className',
    'border',
  ]);
  const props = split[0];
  const rest = split[1];
  const [hasError, setHasError] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);
  const [backgroundColor, setBackgroundColor] = createSignal<string | null>(
    null,
  );

  const handleLoad = (e: Event) => {
    setIsLoading(false);
    if (!(e.currentTarget instanceof HTMLImageElement)) {
      return;
    }
    colorsUtils.fac
      .getColorAsync(e.currentTarget, { algorithm: 'simple' })
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

  return (
    <span
      class={cn('relative inline-block h-full w-full', props.className, {
        'bg-background': backgroundColor() === null,
        'border border-border/50 dark:bg-foreground/10':
          backgroundColor() === null && props.border,
        'rounded-lg': props.roundedCorner,
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
        <span class="absolute inset-0 flex items-center justify-center">
          {props.fallback ?? <Skeleton class="w-full h-full" />}
        </span>
      </Show>
      <Show
        when={!hasError() && props.src}
        fallback={
          <span class="absolute inset-0 flex items-center justify-center">
            {props.fallback ?? <Skeleton class="w-full h-full" />}
          </span>
        }
      >
        <img
          src={props.src}
          alt={props.alt}
          crossOrigin="anonymous"
          onLoad={handleLoad}
          onError={handleError}
          class={cn(
            'transition-opacity duration-500 w-full h-full object-contain',
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
