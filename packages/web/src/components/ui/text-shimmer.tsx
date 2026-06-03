import { splitProps, type JSX, type ValidComponent } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { cn } from '@/lib/utils';

function TextShimmer(props: TextShimmerProps) {
  const [local, rest] = splitProps(props, [
    'as',
    'class',
    'className',
    'duration',
    'spread',
    'children',
  ]);
  const spread = () => Math.min(Math.max(local.spread ?? 20, 5), 45);

  return (
    <Dynamic
      component={local.as ?? 'span'}
      class={cn(
        'bg-[length:200%_auto] bg-clip-text font-medium text-transparent',
        'animate-[shimmer_4s_infinite_linear]',
        local.class,
        local.className,
      )}
      style={{
        'background-image': `linear-gradient(to right, var(--muted-foreground) ${
          50 - spread()
        }%, var(--foreground) 50%, var(--muted-foreground) ${50 + spread()}%)`,
        'animation-duration': `${local.duration ?? 4}s`,
      }}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
}

type TextShimmerProps = {
  as?: ValidComponent;
  className?: string;
  duration?: number;
  spread?: number;
  children: JSX.Element;
} & JSX.HTMLAttributes<HTMLElement>;

export { TextShimmer };
export type { TextShimmerProps };
