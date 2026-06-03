import * as SliderPrimitive from '@kobalte/core/slider';
import { For, createMemo, splitProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

function Slider(props: SliderProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'defaultValue',
    'value',
    'min',
    'max',
    'orientation',
  ]);
  const min = () => local.min ?? 0;
  const max = () => local.max ?? 100;
  const orientation = () => local.orientation ?? 'horizontal';
  const isVertical = () => orientation() === 'vertical';
  const values = createMemo(() => {
    if (Array.isArray(local.value)) return local.value;
    if (Array.isArray(local.defaultValue)) return local.defaultValue;
    return [min(), max()];
  });

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={local.defaultValue}
      value={local.value}
      min={min()}
      max={max()}
      orientation={orientation()}
      class={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50',
        isVertical() && 'h-full min-h-44 w-auto flex-col',
        local.class,
        local.className,
      )}
      {...rest}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        class={cn(
          'relative grow overflow-hidden rounded-full bg-muted',
          isVertical() ? 'h-full w-1.5' : 'h-1.5 w-full',
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          class={cn('absolute bg-primary', isVertical() ? 'w-full' : 'h-full')}
        />
      </SliderPrimitive.Track>
      <For each={Array.from({ length: values().length })}>
        {() => (
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

type SliderProps = Omit<JSX.IntrinsicElements['div'], 'onChange'> & {
  class?: string;
  className?: string;
  defaultValue?: number[];
  value?: number[];
  min?: number;
  max?: number;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  onChange?: (value: number[]) => void;
};
