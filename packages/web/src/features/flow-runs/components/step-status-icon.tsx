import { StepOutputStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { createMemo, Match, mergeProps, Switch, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { LoadingSpinner } from '@/components/custom/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { cn } from '@/lib/utils';

type StepStatusIconProps = {
  status: StepOutputStatus;
  size: '3' | '4' | '5' | '4.5';
  hideTooltip?: boolean;
};

const statusText = {
  [StepOutputStatus.RUNNING]: t('Step running'),
  [StepOutputStatus.PAUSED]: t('Step paused'),
  [StepOutputStatus.STOPPED]: t('Step Stopped'),
  [StepOutputStatus.SUCCEEDED]: t('Step Succeeded'),
  [StepOutputStatus.FAILED]: t('Step Failed'),
};

const StepStatusIcon = (_props: StepStatusIconProps) => {
  const props = mergeProps({ hideTooltip: false }, _props);
  const state = createMemo(() => {
    const { Icon, extraClassName } = flowRunUtils.getStatusIconForStep(
      props.status,
    );
    return {
      Icon,
      className: cn(extraClassName, {
        'size-3': props.size === '3',
        'size-4.5': props.size === '4.5',
        'size-4': props.size === '4',
        'size-5': props.size === '5',
      }),
    };
  });
  return (
    <Switch>
      <Match when={props.status === StepOutputStatus.RUNNING}>
        <LoadingSpinner class={state().className} />
      </Match>
      <Match when={props.status !== StepOutputStatus.RUNNING}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Dynamic component={state().Icon} class={state().className} />
          </TooltipTrigger>
          <Show when={!props.hideTooltip}>
            <TooltipContent side="bottom">
              {statusText[props.status]}
            </TooltipContent>
          </Show>
        </Tooltip>
      </Match>
    </Switch>
  );
};
export { StepStatusIcon };
