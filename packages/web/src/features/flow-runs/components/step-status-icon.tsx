import { StepOutputStatus } from '@activepieces/shared';
import { t } from 'i18next';

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

const StepStatusIcon = ({
  status,
  size,
  hideTooltip = false,
}: StepStatusIconProps) => {
  const { Icon, extraClassName } = flowRunUtils.getStatusIconForStep(status);
  const sizeClassName = {
    'size-3': size === '3',
    'size-4.5': size === '4.5',
    'size-4': size === '4',
    'size-5': size === '5',
  };
  const className = cn(extraClassName, sizeClassName);
  if (status === StepOutputStatus.RUNNING) {
    return <LoadingSpinner class={className}></LoadingSpinner>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Icon class={className}></Icon>
      </TooltipTrigger>
      {!hideTooltip && (
        <TooltipContent side="bottom">{statusText[status]}</TooltipContent>
      )}
    </Tooltip>
  );
};
StepStatusIcon.displayName = 'StepStatusIcon';
export { StepStatusIcon };
