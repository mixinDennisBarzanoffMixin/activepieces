import {
  FlowTriggerType,
  FlowVersionState,
  StepOutputStatus,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-solid';
import { Show, createMemo } from 'solid-js';

import { InvalidStepIcon } from '@/components/custom/alert-icon';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { StepStatusIcon, flowRunUtils } from '@/features/flow-runs';
import { pieceSelectorUtils } from '@/features/pieces';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';
type DraftStepStatus =
  | 'invalid'
  | 'testing'
  | 'failed'
  | 'needs-test'
  | 'tested'
  | 'untested';

const ApStepNodeStatusInDraft = (props: { stepName: string }) => {
  const [
    run,
    isBeingTested,
    hasError,
    lastTestDate,
    lastUpdatedDate,
    stepType,
    isInDraft,
    isStepValid,
    isManualTrigger,
    isSkipped,
  ] = useBuilderStateContext((state) => {
    const step = flowStructureUtil.getStep(
      props.stepName,
      state.flowVersion.trigger,
    );
    const isManualTrigger =
      step?.type === FlowTriggerType.PIECE &&
      pieceSelectorUtils.isManualTrigger({
        pieceName: step.settings.pieceName,
        triggerName: step.settings.triggerName ?? '',
      });
    return [
      state.run,
      state.isStepBeingTested(props.stepName),
      !isNil(state.errorLogs[props.stepName]),
      getLastTestDate(step?.settings),
      step?.lastUpdatedDate ?? '',
      step?.type,
      state.flowVersion.state === FlowVersionState.DRAFT,
      !!step?.valid,
      isManualTrigger,
      flowCanvasUtils.isSkipped(props.stepName, state.flowVersion.trigger),
    ];
  });

  function getLastTestDate(settings: unknown) {
    if (
      typeof settings !== 'object' ||
      settings === null ||
      !('sampleData' in settings) ||
      typeof settings.sampleData !== 'object' ||
      settings.sampleData === null ||
      !('lastTestDate' in settings.sampleData)
    ) {
      return undefined;
    }
    return typeof settings.sampleData.lastTestDate === 'string'
      ? settings.sampleData.lastTestDate
      : undefined;
  }

  const draftStatusConfig: Record<
    DraftStepStatus,
    {
      variant: 'default' | 'success' | 'error' | 'warning';
      text: string;
      icon: any;
    }
  > = {
    invalid: {
      variant: 'warning',
      text: t('Incomplete'),
      icon: <InvalidStepIcon class="size-3" />,
    },
    testing: {
      variant: 'default',
      text: t('Testing...'),
      icon: (
        <StepStatusIcon
          status={StepOutputStatus.RUNNING}
          size="3"
          hideTooltip={true}
        />
      ),
    },
    failed: {
      variant: 'error',
      text: t('Failed'),
      icon: (
        <StepStatusIcon
          status={StepOutputStatus.FAILED}
          size="3"
          hideTooltip={true}
        />
      ),
    },
    'needs-test': {
      variant: 'default',
      text: t('Test me'),
      icon: <TriangleAlert class="size-3" />,
    },
    untested: {
      variant: 'default',
      text: t('Test me'),
      icon: <TriangleAlert class="size-3" />,
    },
    tested: {
      variant: 'success',
      text: t('Tested'),
      icon: (
        <StepStatusIcon
          status={StepOutputStatus.SUCCEEDED}
          size="3"
          hideTooltip={true}
        />
      ),
    },
  };
  const status = createMemo<DraftStepStatus>(() => {
    if (!isStepValid) return 'invalid';
    if (isBeingTested) return 'testing';

    if (isNil(lastTestDate)) {
      return 'untested';
    }
    if (lastUpdatedDate > lastTestDate) {
      return 'needs-test';
    }
    if (hasError) return 'failed';

    return 'tested';
  });

  const hasRun = !isNil(run);
  const shouldShowDraftStatusBadge =
    isInDraft &&
    !hasRun &&
    stepType !== FlowTriggerType.EMPTY &&
    !isManualTrigger &&
    !isSkipped;

  return (
    <Show when={shouldShowDraftStatusBadge}>
      <div class="absolute right-[1px] h-[20px] -top-[28px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              class={flowRunUtils.getStatusContainerClassName(
                draftStatusConfig[status()].variant,
                true,
              )}
            >
              {draftStatusConfig[status()].icon}
              <div>{draftStatusConfig[status()].text}</div>
            </div>
          </TooltipTrigger>
          <Show when={status() === 'untested'}>
            <TooltipContent>
              {t('This step has not been tested yet')}
            </TooltipContent>
          </Show>
          <Show when={status() === 'needs-test'}>
            <TooltipContent>
              {t('This step has been updated since the last test')}
            </TooltipContent>
          </Show>
        </Tooltip>
      </div>
    </Show>
  );
};

export { ApStepNodeStatusInDraft };
