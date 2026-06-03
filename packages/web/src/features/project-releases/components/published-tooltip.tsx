import { t } from 'i18next';
import { JSX, Show } from 'solid-js';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type PublishedNeededTooltipProps = {
  children: JSX.Element;
  allowPush: boolean;
  ref?: HTMLButtonElement | ((el: HTMLButtonElement) => void);
};

export function PublishedNeededTooltip(props: PublishedNeededTooltipProps) {
  const { children, allowPush, ref } = props;
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger ref={ref} asChild disabled={!allowPush}>
        <div>{children}</div>
      </TooltipTrigger>
      <Show when={!allowPush}>
        <TooltipContent side="top">
          {t('Only published flows can be pushed to Git')}
        </TooltipContent>
      </Show>
    </Tooltip>
  );
}
