import {
  AnimatePresence,
  motion as solidMotion,
} from 'motion-solid';
import { splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import type {
  MotionProps,
  Transition,
  Variants,
} from 'motion-solid';

function component(tag: keyof JSX.IntrinsicElements) {
  const Component = solidMotion[tag as keyof typeof solidMotion] as Component<Record<string, unknown>>;
  return (props: Record<string, unknown>) => {
    const [local, rest] = splitProps(props, ['animate']);
    return <Component animate={local.animate} {...rest} />;
  };
}

const motion = new Proxy(component('div'), {
  get: (_target, tag: string) => component(tag as keyof JSX.IntrinsicElements),
});

export { AnimatePresence, motion };
export type { MotionProps, Transition, Variants };
