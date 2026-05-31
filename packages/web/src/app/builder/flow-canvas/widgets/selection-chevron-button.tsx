import { ChevronDown } from 'lucide-solid';
import { createEffect } from 'solid-js';
import { render } from 'solid-js/web';

import { Button } from '@/components/ui/button';

import { flowCanvasConsts } from '../utils/consts';

const showChevronNextToSelection = (targetDiv: HTMLElement) => {
  const container = document.createElement('div');
  targetDiv.appendChild(container);
  const dispose = render(() => (
    <Button
      variant="outline"
      size="icon"
      class="absolute top-[10px] -left-10 z-50"
      {...{
        [`data-${flowCanvasConsts.SELECTION_RECT_CHEVRON_ATTRIBUTE}`]: true,
      }}
      onClick={(e) => {
        const rightClickEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          clientX: e.clientX,
          clientY: e.clientY,
        });
        e.target.dispatchEvent(rightClickEvent);
      }}
    >
      <ChevronDown class="w-4 h-4" />
    </Button>
  ), container);
  return dispose;
};

export const useShowChevronNextToSelection = () => {
  createEffect(() => {
    let dispose: VoidFunction | null = null;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            node.children.length > 0 &&
            node.children[0].classList.contains(
              flowCanvasConsts.NODE_SELECTION_RECT_CLASS_NAME,
            )
          ) {
            dispose = showChevronNextToSelection(node.children[0] as HTMLElement);
          }
        });
        // Handle removed nodes
        mutation.removedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            node.children.length > 0 &&
            node.children[0].classList.contains(
              flowCanvasConsts.NODE_SELECTION_RECT_CLASS_NAME,
            )
          ) {
            if (dispose) {
              dispose();
              dispose = null;
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      observer.disconnect();
      // Unmount all roots on cleanup
      if (dispose) {
        dispose();
      }
    };
  });
};
