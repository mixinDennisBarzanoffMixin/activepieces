import { isNil } from '@activepieces/shared';
import { createVirtualizer } from '@tanstack/solid-virtual';
import { For, createEffect, untrack, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

import { ScrollArea } from './scroll-area';

interface VirtualizedScrollAreaProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => JSX.Element;
  overscan?: number;
  estimateSize: (index: number) => number;
  getItemKey?: (index: number) => string | number;
  class?: string;
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

const VirtualizedScrollArea = <T,>(props: VirtualizedScrollAreaProps<T>) => {
  let scrollAreaViewportRef: HTMLDivElement | undefined;

  const rowVirtualizer = createVirtualizer({
    count: untrack(() => props.items.length),
    getScrollElement: () => scrollAreaViewportRef,
    estimateSize: untrack(() => props.estimateSize),
    overscan: untrack(() => props.overscan ?? 5),
    getItemKey: untrack(() => props.getItemKey || ((index) => index)),
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  createEffect(() => {
    if (isNil(props.initialScroll)) {
      return;
    }
    if (props.initialScroll.index > -1) {
      rowVirtualizer.scrollToIndex(props.initialScroll.index, {
        align: 'start',
        behavior: 'auto',
      });
      if (props.initialScroll.clickAfterScroll) {
        //need to wait for the scroll to be completed
        setTimeout(() => {
          const targetElement = scrollAreaViewportRef?.querySelector(
            `[data-virtual-index="${props.initialScroll?.index}"]`,
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
      class={cn('h-full', props.class, props.className)}
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
              {props.renderItem(
                props.items[virtualItem.index],
                virtualItem.index,
              )}
            </div>
          )}
        </For>
      </div>
    </ScrollArea>
  );
};

export { VirtualizedScrollArea };
