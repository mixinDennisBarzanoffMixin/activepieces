import { mergeProps, type JSX } from 'solid-js';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ButtonWithTooltipProps = {
  tooltip: string;
  onClick: (e?: MouseEvent) => void;
  variant?:
    | 'ghost'
    | 'outline'
    | 'default'
    | 'destructive'
    | 'secondary'
    | 'link';
  icon: JSX.Element;
  className?: string;
  disabled?: boolean;
  hasPermission?: boolean;
};

export const ButtonWithTooltip = (_props: ButtonWithTooltipProps) => {
  const props = mergeProps(
    {
      variant: 'ghost',
      className: 'h-7 w-7',
      disabled: false,
      hasPermission: true,
    },
    _props,
  );
  return (
    <PermissionNeededTooltip hasPermission={props.hasPermission}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={props.variant}
              size="icon"
              class={props.className}
              onClick={(e) => props.onClick(e)}
              disabled={props.disabled || !props.hasPermission}
            >
              {props.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{props.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </PermissionNeededTooltip>
  );
};
