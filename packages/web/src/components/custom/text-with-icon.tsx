import { mergeProps, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export function TextWithIcon(_props: {
  icon: JSX.Element;
  text: JSX.Element;
  children?: JSX.Element;
  className?: string;
}) {
  const props = mergeProps({ className: '' }, _props);
  return (
    <div class={cn('flex items-center gap-2', props.className)}>
      {props.icon}
      {props.text}
      {props.children}
    </div>
  );
}
