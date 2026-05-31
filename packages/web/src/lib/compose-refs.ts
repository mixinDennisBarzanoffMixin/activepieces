// @see https://github.com/radix-ui/primitives/blob/main/packages/react/compose-refs/src/composeRefs.tsx

type PossibleRef<T> = ((value: T) => void) | { current: T } | null | undefined;

/**
 * Set a given ref to a given value
 * This utility takes care of different types of refs: callback refs and RefObject(s)
 */
function setRef<T>(ref: PossibleRef<T>, value: T) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    ref.current = value;
  }
}

/**
 * A utility to compose multiple refs together
 * Accepts callback refs and RefObject(s)
 */
function composeRefs<T>(...refs: PossibleRef<T>[]) {
  return (node: T) => refs.forEach((ref) => setRef(ref, node));
}

/**
 * A custom hook that composes multiple refs
 * Accepts callback refs and RefObject(s)
 */
function useComposedRefs<T>(...refs: PossibleRef<T>[]) {
  return composeRefs(...refs);
}

export { composeRefs, useComposedRefs };
