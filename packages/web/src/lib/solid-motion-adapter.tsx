import { AnimatePresence, motion as solidMotion } from 'motion-solid';
import type { MotionProps, Transition, Variants } from 'motion-solid';
import { splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';

function component(tag: keyof JSX.IntrinsicElements) {
  const Component = solidMotion[tag as keyof typeof solidMotion] as Component<
    Record<string, unknown>
  >;
  return (props: Record<string, unknown>) => {
    const [local, rest] = splitProps(props, ['animate']);
    return <Component animate={local.animate} {...rest} />;
  };
}

const motion = Object.assign(component('div'), {
  button: component('button'),
  circle: component('circle'),
  div: component('div'),
  g: component('g'),
  line: component('line'),
  path: component('path'),
  polygon: component('polygon'),
  rect: component('rect'),
  span: component('span'),
  svg: component('svg'),
});

export { AnimatePresence, motion };
export type { MotionProps, Transition, Variants };
