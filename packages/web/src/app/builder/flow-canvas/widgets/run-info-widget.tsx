import {
  ApFlagId,
  FlowRunStatus,
  isFlowRunStateTerminal,
  StepOutputStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowRight, CircleHelp, Magnet } from 'lucide-solid';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { flowRunUtils } from '@/features/flow-runs';
import { flagsHooks } from '@/hooks/flags-hooks';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { EditFlowOrViewDraftButton } from '../../builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '../../builder-hooks';
import { useReactFlow } from '../solid-flow-adapter';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';

import LargeWidgetWrapper from './large-widget-wrapper';

function getStatusText({
  status,
  timeout,
  memoryLimit,
  logSizeLimit,
}: {
  status: FlowRunStatus;
  timeout: number;
  memoryLimit: number;
  logSizeLimit: number;
}) {
  switch (status) {
    case FlowRunStatus.SUCCEEDED:
      return t('Run Succeeded');
    case FlowRunStatus.FAILED:
      return t('Run Failed');
    case FlowRunStatus.PAUSED:
      return t('Run Paused');
    case FlowRunStatus.QUOTA_EXCEEDED:
      return t('Quota Exceeded');
    case FlowRunStatus.LOG_SIZE_EXCEEDED:
      return t(
        'Run failed due to output of steps exceeding the log size limit of {logSizeLimit} MB',
        { logSizeLimit },
      );
    case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
      return t(
        'Run failed due to exceeding the memory limit of {memoryLimit} MB',
        {
          memoryLimit: Math.floor(memoryLimit / 1024),
        },
      );
    case FlowRunStatus.QUEUED:
      return t('Queued');
    case FlowRunStatus.RUNNING:
      return t('Running');
    case FlowRunStatus.TIMEOUT:
      return t('Run exceeded {timeout} seconds, try to optimize your steps.', {
        timeout,
      });
    case FlowRunStatus.INTERNAL_ERROR:
      return t('Run failed for an unknown reason, contact support.');
    case FlowRunStatus.CANCELED:
      return t('Run Cancelled');
  }
}

const RunInfoWidget = () => {
  const run = useBuilderStateContext((state) => ({ value: state.run })).value;
  const { data: timeoutSeconds } = flagsHooks.useFlag<number>(
    ApFlagId.FLOW_RUN_TIME_SECONDS,
  );
  const { data: memoryLimit } = flagsHooks.useFlag<number>(
    ApFlagId.FLOW_RUN_MEMORY_LIMIT_KB,
  );
  const { data: logSizeLimit } = flagsHooks.useFlag<number>(
    ApFlagId.FLOW_RUN_LOG_SIZE_LIMIT_MB,
  );
  return (
    <Show when={run} keyed>
      {(value) => {
        const icon = value
          ? flowRunUtils.getStatusIcon(value.status)
          : { variant: 'default' as const, Icon: CircleHelp };
        const terminal = isFlowRunStateTerminal({
          status: value.status,
          ignoreInternalError: false,
        });
        return (
          <LargeWidgetWrapper
            containerClassName={cn(
              flowRunUtils.getStatusContainerClassName(icon.variant),
              'bg-background border border-border dark:bg-background dark:border-border',
            )}
            key={value.id + value.status}
          >
            <div class="flex items-center justify-between w-full flex-wrap">
              <div class="flex items-center text-sm shrink-0">
                <icon.Icon class="size-5 mr-2" />
                <span class="text-foreground dark:text-foreground font-medium">
                  {getStatusText({
                    status: value.status,
                    timeout: timeoutSeconds ?? -1,
                    memoryLimit: memoryLimit ?? -1,
                    logSizeLimit: logSizeLimit ?? -1,
                  })}
                </span>

                <div class="shrink-0 text-foreground dark:text-foreground">
                  <Show when={terminal}>
                    <>
                      &nbsp;-&nbsp;
                      <Show when={value.startTime}>
                        <DateSection
                          text={t('Started')}
                          dateOrDuration={formatUtils.formatDateWithTime(
                            new Date(value.startTime),
                            true,
                          )}
                        />
                      </Show>
                      {', '}
                      <Show when={value.finishTime && value.startTime}>
                        <DateSection
                          text={t('Took')}
                          dateOrDuration={formatUtils.formatDuration(
                            new Date(value.finishTime).getTime() -
                              new Date(value.startTime).getTime(),
                          )}
                        />
                      </Show>
                    </>
                  </Show>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <ResumeLiveFollowButton isRunTerminal={terminal} />
                <Show when={value.failedStep} keyed>
                  {(step) => (
                    <JumpToFailedStepButton failedStepName={step.name} />
                  )}
                </Show>
                <EditFlowOrViewDraftButton onCanvas={false} />
              </div>
            </div>
          </LargeWidgetWrapper>
        );
      }}
    </Show>
  );
};

export { RunInfoWidget };

const DateSection = (props: { text: string; dateOrDuration: string }) => {
  return (
    <>
      <span>{`${props.text}: `}</span>
      <span>{`${props.dateOrDuration}`}</span>
    </>
  );
};

const ResumeLiveFollowButton = (props: { isRunTerminal: boolean }) => {
  const [userManuallySelectedStepDuringRun, resumeLiveFollow] =
    useBuilderStateContext((state) => [
      state.userManuallySelectedStepDuringRun,
      state.resumeLiveFollow,
    ]);
  return (
    <Show when={!props.isRunTerminal && userManuallySelectedStepDuringRun}>
      <Button variant="ghost" size="sm" onClick={resumeLiveFollow}>
        <Magnet class="size-4" />
        {t('Follow run updates')}
      </Button>
    </Show>
  );
};

const JumpToFailedStepButton = (props: { failedStepName: string }) => {
  const [selectedStep, selectFailedStep, run, loopsIndexes] =
    useBuilderStateContext((state) => [
      state.selectedStep,
      state.selectFailedStep,
      state.run,
      state.loopsIndexes,
    ]);
  const { fitView } = useReactFlow();
  const selectedStepOutput =
    run && selectedStep
      ? flowRunUtils.extractStepOutput(
          selectedStep,
          loopsIndexes,
          run.steps ?? {},
        )
      : null;
  const selectedFailedStep =
    selectedStep === props.failedStepName &&
    selectedStepOutput?.status === StepOutputStatus.FAILED;
  const handleClick = () => {
    selectFailedStep();
    void fitView(
      flowCanvasUtils.createFocusStepInGraphParams(props.failedStepName),
    );
  };
  return (
    <Show when={!selectedFailedStep}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        class="text-destructive-700 hover:text-destructive-700 dark:text-destructive-200 dark:hover:text-destructive-200"
      >
        <ArrowRight class="size-4" />
        {t('See error')}
      </Button>
    </Show>
  );
};
