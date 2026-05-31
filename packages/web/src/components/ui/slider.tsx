import * as SliderPrimitive from '@kobalte/core/slider';
import { For, createMemo } from 'solid-js';

import { cn } from '@/lib/utils';

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  orientation = 'horizontal',
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>) {
  const isVertical = orientation === 'vertical';
  const _values = createMemo(() =>
    Array.isArray(value)
      ? value
      : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      orientation={orientation}
      class={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50',
        isVertical && 'h-full min-h-44 w-auto flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        class={cn(
          'relative grow overflow-hidden rounded-full bg-muted',
          isVertical ? 'h-full w-1.5' : 'h-1.5 w-full',
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          class={cn('absolute bg-primary', isVertical ? 'w-full' : 'h-full')}
        />
      </SliderPrimitive.Track>
      <For each={Array.from({ length: _values.length })}>
        {(_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            class="block size-4 shrink-0 rounded-full border border-primary bg-white dark:bg-background shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          />
        )}
      </For>
    </SliderPrimitive.Root>
  );
}

export { Slider };
