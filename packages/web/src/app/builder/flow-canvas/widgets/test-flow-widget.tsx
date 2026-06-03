import {
  isNil,
  FlowTriggerType,
  UpdateRunProgressRequest,
  assertNotNullOrUndefined,
  FlowRun,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Show } from 'solid-js';

import { EditFlowOrViewDraftButton } from '@/app/builder/builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ChatDrawerSource } from '@/app/builder/types';
import { flowRunUtils } from '@/features/flow-runs';
import { flowHooks } from '@/features/flows';
import { pieceSelectorUtils } from '@/features/pieces';

import { AboveTriggerButton } from './above-trigger-button';

const TestFlowWidget = () => {
  const [
    setChatDrawerOpenSource,
    flowVersion,
    readonly,
    hideTestWidget,
    run,
    setRun,
    publishedVersionId,
  ] = useBuilderStateContext((state) => [
    state.setChatDrawerOpenSource,
    state.flowVersion,
    state.readonly,
    state.hideTestWidget,
    state.run,
    state.setRun,
    state.flow.publishedVersionId,
  ]);
  const runRef: FlowRun | null = run;

  const isPieceTrigger = flowVersion.trigger.type === FlowTriggerType.PIECE;
  const value: unknown = flowVersion.trigger.settings;
  const settings =
    isPieceTrigger && isPieceTriggerSettings(value) ? value : undefined;
  const triggerHasSampleData = !isNil(settings?.sampleData?.lastTestDate);
  const isChatTrigger =
    !isNil(settings) &&
    pieceSelectorUtils.isChatTrigger(settings.pieceName, settings.triggerName);
  const isManualTrigger =
    !isNil(settings) &&
    pieceSelectorUtils.isManualTrigger({
      pieceName: settings.pieceName,
      triggerName: settings.triggerName,
    });

  const { mutate: runFlow, isPending: isTestingFlow } =
    flowHooks.useTestFlowOrStartManualTrigger({
      flowVersionId: flowVersion.id,
      isForManualTrigger: isManualTrigger,
      onUpdateRun: (response: UpdateRunProgressRequest) => {
        assertNotNullOrUndefined(response.flowRun, 'flowRun');
        const steps = runRef?.steps ?? {};
        const startTime = response.flowRun.startTime ?? runRef?.startTime;
        if (!isNil(response.step)) {
          const updatedSteps = flowRunUtils.updateRunSteps(
            steps,
            response.step.name,
            response.step.path,
            response.step.output,
          );
          setRun(
            { ...response.flowRun, startTime, steps: updatedSteps },
            flowVersion,
          );
        }
        setRun({ ...response.flowRun, startTime, steps }, flowVersion);
      },
    });

  return (
    <Show
      when={
        flowVersion.valid &&
        !hideTestWidget &&
        (!isManualTrigger ||
          (publishedVersionId === flowVersion.id && !isNil(publishedVersionId)))
      }
    >
      <Show
        when={!readonly}
        fallback={<EditFlowOrViewDraftButton onCanvas={true} />}
      >
        <Show
          when={!isChatTrigger}
          fallback={
            <AboveTriggerButton
              onClick={() => {
                setChatDrawerOpenSource(ChatDrawerSource.TEST_FLOW);
              }}
              text={t('Open Chat')}
              loading={isTestingFlow}
            />
          }
        >
          <AboveTriggerButton
            onClick={() => {
              runFlow();
            }}
            text={isManualTrigger ? t('Run Flow') : t('Test Flow')}
            disable={!triggerHasSampleData && !isManualTrigger}
            loading={isTestingFlow}
          />
        </Show>
      </Show>
    </Show>
  );
};

function isPieceTriggerSettings(
  settings: unknown,
): settings is PieceTriggerSettings {
  if (!settings || typeof settings !== 'object') {
    return false;
  }
  if (!('pieceName' in settings) || !('triggerName' in settings)) {
    return false;
  }
  if (
    typeof settings.pieceName !== 'string' ||
    typeof settings.triggerName !== 'string'
  ) {
    return false;
  }
  return true;
}

export { TestFlowWidget };

type PieceTriggerSettings = {
  pieceName: string;
  triggerName: string;
  sampleData?: { lastTestDate?: unknown };
};
