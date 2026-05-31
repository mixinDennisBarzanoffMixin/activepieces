import { t } from 'i18next';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const PermissionNeededTooltip = (props: {
  children: any;
  hasPermission: boolean;
  ref?: HTMLButtonElement;
}) => {
  let ref: HTMLButtonElement | undefined;
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger
        ref={(el) => (ref = el)}
        asChild
        disabled={!props.hasPermission}
      >
        <div>{props.children}</div>
      </TooltipTrigger>
      <Show when={!props.hasPermission}>
        <TooltipContent side="top">{t('Permission needed')}</TooltipContent>
      </Show>
    </Tooltip>
  );
};

PermissionNeededTooltip.displayName = 'PermissionNeededWrapper';
