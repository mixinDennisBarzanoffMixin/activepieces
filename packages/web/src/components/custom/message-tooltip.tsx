import { t } from 'i18next';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const MessageTooltip = (props: {
  children: any;
  isDisabled: boolean;
  message: string;
  ref?: HTMLButtonElement;
}) => {
  let ref: HTMLButtonElement | undefined;
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger ref={(el) => (ref = el)} asChild>
        <div>{props.children}</div>
      </TooltipTrigger>
      <Show when={props.isDisabled}>
        <TooltipContent side="bottom">{t(props.message)}</TooltipContent>
      </Show>
    </Tooltip>
  );
};

MessageTooltip.displayName = 'MessageTooltip';
