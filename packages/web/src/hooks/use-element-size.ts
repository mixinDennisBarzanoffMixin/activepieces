import { createSignal, createEffect } from 'solid-js';

import { useDebouncedCallback } from '@/lib/debounce';

export const useElementSize = (ref: ElementRef) => {
  const [size, setSize] = createSignal({ width: 0, height: 0 });
  const debouncedSetSize = useDebouncedCallback(setSize, 150);
  createEffect(() => {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        debouncedSetSize({ width, height });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    const element = getElement(ref);

    if (element) {
      resizeObserver.observe(element);
    }

    return () => {
      resizeObserver.disconnect();
    };
  });

  return size;
};

function getElement(ref: ElementRef) {
  return ref instanceof HTMLElement ? ref : ref?.current ?? null;
}

type ElementRef =
  | HTMLElement
  | null
  | undefined
  | {
      current: HTMLElement | null;
    };
