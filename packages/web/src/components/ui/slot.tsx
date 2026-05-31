import { JSX } from 'solid-js';

function Root(props: JSX.HTMLAttributes<HTMLElement> & { children?: JSX.Element }) {
  return <>{props.children}</>;
}

export const Slot = { Root };
