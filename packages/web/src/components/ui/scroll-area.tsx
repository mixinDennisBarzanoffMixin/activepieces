import { createEffect, createSignal } from 'solid-js';

import { cn } from '@/lib/utils';

function ScrollArea({
  className,
  children,
  viewPortClassName,
  viewPortRef,
  orientation = 'vertical',
  showGradient = false,
  gradientClassName,
  ...props
}: JSX.IntrinsicElements['div'] & ScrollAreaCustomProps) {
  const [showBottomGradient, setShowBottomGradient] = createSignal(false);
  let internalViewPortRef: HTMLDivElement | undefined;
  let viewportRef = viewPortRef || internalViewPortRef;

  createEffect(() => {
    if (!showGradient || !viewportRef) return;

    const viewport = viewportRef;
    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const hasScrollableContent = scrollHeight > clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      setShowBottomGradient(hasScrollableContent && !isAtBottom);
    };

    checkScroll();
    viewport.addEventListener('scroll', checkScroll);

    const resizeObserver = new ResizeObserver(checkScroll);
    if (viewport.firstElementChild) {
      resizeObserver.observe(viewport.firstElementChild);
    }

    return () => {
      viewport.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  });

  return (
    <div
      data-slot="scroll-area"
      class={cn('relative overflow-hidden', className)}
      {...props}
    >
      <div
        data-slot="scroll-area-viewport"
        class={cn(
          'size-full overflow-auto rounded-[inherit] [&>div]:block!',
          viewPortClassName,
        )}
        ref={(el) => {
          viewportRef = el;
        }}
      >
        {children}
      </div>
      <ScrollBar orientation={orientation} />

      {showGradient && showBottomGradient && (
        <div
          className={cn(
            'pointer-events-none absolute bottom-0 left-0 right-0 h-1/5 bg-linear-to-t from-sidebar to-transparent',
            gradientClassName,
          )}
        />
      )}
    </div>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: JSX.IntrinsicElements['div'] & { orientation?: 'vertical' | 'horizontal' }) {
  return (
    <div
      data-slot="scroll-area-scrollbar"
      class={cn(
        'pointer-events-none absolute flex touch-none transition-colors select-none',
        orientation === 'vertical' && 'right-0 top-0 h-full w-1.5',
        orientation === 'horizontal' && 'bottom-0 left-0 h-1.5 w-full flex-col',
        className,
      )}
      {...props}
    >
      <div
        data-slot="scroll-area-thumb"
        class="relative flex-1 rounded-full bg-border hover:bg-ring transition-colors"
      />
    </div>
  );
}

export { ScrollArea, ScrollBar };

type ScrollAreaCustomProps = {
  viewPortClassName?: string;
  orientation?: 'vertical' | 'horizontal';
  viewPortRef?: HTMLDivElement | null | undefined;
  showGradient?: boolean;
  gradientClassName?: string;
};
