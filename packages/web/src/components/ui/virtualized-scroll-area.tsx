import { isNil } from '@activepieces/shared';
import { createVirtualizer } from '@tanstack/solid-virtual';
import { For, createEffect } from 'solid-js';

import { cn } from '@/lib/utils';

import { ScrollArea } from './scroll-area';

interface VirtualizedScrollAreaProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => JSX.Element;
  overscan?: number;
  estimateSize: (index: number) => number;
  getItemKey?: (index: number) => string | number;
  className?: string;
  initialScroll?: {
    index: number;
    clickAfterScroll: boolean;
  };
}

export interface VirtualizedScrollAreaRef {
  scrollToIndex: (
    index: number,
    options?: {
      align?: 'start' | 'center' | 'end';
      behavior?: 'auto' | 'smooth';
    },
  ) => void;
}

const VirtualizedScrollArea = <T,>({
  items,
  renderItem,
  overscan = 5,
  estimateSize,
  getItemKey,
  initialScroll,
  className,
  ...props
}: VirtualizedScrollAreaProps<T>) => {
  let scrollAreaViewportRef: HTMLDivElement | undefined;

  const rowVirtualizer = createVirtualizer({
    count: items.length,
    getScrollElement: () => scrollAreaViewportRef,
    estimateSize: estimateSize,
    overscan,
    getItemKey: getItemKey || ((index) => index),
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  createEffect(() => {
    if (isNil(initialScroll)) {
      return;
    }
    if (initialScroll.index > -1) {
      rowVirtualizer.scrollToIndex(initialScroll.index, {
        align: 'start',
        behavior: 'auto',
      });
      if (initialScroll?.clickAfterScroll) {
        //need to wait for the scroll to be completed
        setTimeout(() => {
          const targetElement = scrollAreaViewportRef?.querySelector(
            `[data-virtual-index="${initialScroll.index}"]`,
          );
          const renderedElement = targetElement?.children[0];
          if (renderedElement instanceof HTMLElement) {
            renderedElement.click();
          }
        }, 100);
      }
    }
  });
  return (
    <ScrollArea
      viewPortRef={scrollAreaViewportRef}
      {...props}
      class={cn('h-full', className)}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <For each={virtualItems}>
          {(virtualItem) => (
            <div
              data-virtual-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(items[virtualItem.index], virtualItem.index)}
            </div>
          )}
        </For>
      </div>
    </ScrollArea>
  );
};

export { VirtualizedScrollArea };
