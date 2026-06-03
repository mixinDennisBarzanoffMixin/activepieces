import { ChevronDown } from 'lucide-solid';

import { Button } from '@/components/ui/button';

const StepNodeChevron = () => {
  return (
    <Button
      variant="ghost"
      size="sm"
      class="p-1 size-7 "
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const event = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          clientX: e.clientX,
          clientY: e.clientY,
        });
        e.target.dispatchEvent(event);
      }}
    >
      <ChevronDown class="w-4 h-4 stroke-muted-foreground" />
    </Button>
  );
};

export { StepNodeChevron };
