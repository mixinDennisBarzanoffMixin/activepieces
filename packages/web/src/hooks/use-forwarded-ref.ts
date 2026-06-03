import { createEffect } from 'solid-js';

type ForwardedRef<T> =
  | ((value: T | undefined) => void)
  | { current: T | undefined }
  | undefined;

export function useForwardedRef<T>(ref: ForwardedRef<T>) {
  let node: T | undefined;

  const set = (value: T | undefined) => {
    node = value;
  };

  createEffect(() => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(node);
      return;
    }
    ref.current = node;
  });

  return set;
}
