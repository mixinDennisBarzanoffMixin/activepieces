import { LucideIcon } from 'lucide-solid';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SelectUtilButton = ({
  onClick,
  Icon,
  tooltipText,
}: {
  onClick?: (e: MouseEvent) => void;
  Icon: LucideIcon;
  tooltipText?: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          class="opacity-50 shrink-0 h-6 w-6 rounded-xs"
          size={'icon'}
          type="button"
          onClick={onClick}
        >
          <Icon class="w-4 h-4"></Icon>
        </Button>
      </TooltipTrigger>
      <Show when={tooltipText}>
        <TooltipContent side="bottom">{tooltipText}</TooltipContent>
      </Show>
    </Tooltip>
  );
};

SelectUtilButton.displayName = 'SelectUtilButton';
export { SelectUtilButton };
