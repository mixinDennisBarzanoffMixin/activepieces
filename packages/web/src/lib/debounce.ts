import { Accessor, createEffect, createSignal, onCleanup } from 'solid-js';

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => {
    if (timeout) clearTimeout(timeout);
  });
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function useDebounce<T>(value: Accessor<T>, delay: number) {
  const [debounced, setDebounced] = createSignal(value());
  createEffect(() => {
    const next = value();
    const timeout = setTimeout(() => setDebounced(() => next), delay);
    onCleanup(() => clearTimeout(timeout));
  });
  return [debounced] as const;
}
