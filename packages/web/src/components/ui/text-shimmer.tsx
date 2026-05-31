import { cn } from '@/lib/utils';

function TextShimmer({
  as = 'span',
  className,
  duration = 4,
  spread = 20,
  children,
  ...props
}: TextShimmerProps) {
  const dynamicSpread = Math.min(Math.max(spread, 5), 45);
  const Component = as as any;

  return (
    <Component
      class={cn(
        'bg-[length:200%_auto] bg-clip-text font-medium text-transparent',
        'animate-[shimmer_4s_infinite_linear]',
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(to right, var(--muted-foreground) ${
          50 - dynamicSpread
        }%, var(--foreground) 50%, var(--muted-foreground) ${
          50 + dynamicSpread
        }%)`,
        animationDuration: `${duration}s`,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

type TextShimmerProps = {
  as?: string;
  duration?: number;
  spread?: number;
  children: JSX.Element;
} & JSX.HTMLAttributes<HTMLElement>;

export { TextShimmer };
export type { TextShimmerProps };
