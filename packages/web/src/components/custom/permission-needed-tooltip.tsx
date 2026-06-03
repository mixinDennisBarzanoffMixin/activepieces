import { t } from 'i18next';
import { Show, type JSX } from 'solid-js';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const PermissionNeededTooltip = (props: {
  children: JSX.Element;
  hasPermission: boolean;
  ref?: HTMLButtonElement;
}) => {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild disabled={!props.hasPermission}>
        <div>{props.children}</div>
      </TooltipTrigger>
      <Show when={!props.hasPermission}>
        <TooltipContent side="top">{t('Permission needed')}</TooltipContent>
      </Show>
    </Tooltip>
  );
};
