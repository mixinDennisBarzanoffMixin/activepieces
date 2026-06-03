import { t } from 'i18next';
import { Show, type JSX } from 'solid-js';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const MessageTooltip = (props: {
  children: JSX.Element;
  isDisabled: boolean;
  message: string;
  ref?: HTMLButtonElement;
}) => {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <div>{props.children}</div>
      </TooltipTrigger>
      <Show when={props.isDisabled}>
        <TooltipContent side="bottom">{t(props.message)}</TooltipContent>
      </Show>
    </Tooltip>
  );
};
