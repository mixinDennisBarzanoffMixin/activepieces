import { LucideIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SelectUtilButton = (props: {
  onClick?: (e: MouseEvent) => void;
  Icon: LucideIcon;
  tooltipText?: string;
}) => {
  const Icon = props.Icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          class="opacity-50 shrink-0 h-6 w-6 rounded-xs"
          size={'icon'}
          type="button"
          onClick={props.onClick}
        >
          <Icon class="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <Show when={props.tooltipText}>
        <TooltipContent side="bottom">{props.tooltipText}</TooltipContent>
      </Show>
    </Tooltip>
  );
};

export { SelectUtilButton };
