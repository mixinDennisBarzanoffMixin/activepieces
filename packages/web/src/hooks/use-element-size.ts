import { useDebouncedCallback } from '@/lib/debounce';
import { createSignal, createEffect } from 'solid-js';

export const useElementSize = (ref: RefObject<HTMLElement | null>) => {
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

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [debouncedSetSize, ref]);

  return size;
};
