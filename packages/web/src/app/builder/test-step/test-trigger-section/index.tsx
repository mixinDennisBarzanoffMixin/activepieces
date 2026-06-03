import {
  FlowTriggerType,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Zap } from 'lucide-solid';
import { Show, untrack } from 'solid-js';

import { triggerEventHooks } from '@/features/flows';

import { useBuilderStateContext } from '../../builder-hooks';
import { TestPanelHeader } from '../test-panel-header';
import { TestPanelViewToggle } from '../test-panel-view-toggle';
import { useTriggerTestRunner } from '../test-runner-context';
import { TestSampleDataViewer } from '../test-sample-data-viewer';

import { FirstTimeTestingSection } from './first-time-testing-section';
import { ManualWebhookTestButton } from './manual-webhook-test-button';
import { SimulationNote } from './simulation-section';
import { TriggerEventSelect } from './trigger-event-select';

type TestTriggerSectionProps = {
  isSaving: boolean;
  flowVersionId: string;
  flowId: string;
  projectId: string;
};

const TestTriggerSection = (props: TestTriggerSectionProps) => {
  const runner = useTriggerTestRunner();
  const currentStep = useBuilderStateContext((state) =>
    state.selectedStep
      ? flowStructureUtil.getStep(state.selectedStep, state.flowVersion.trigger)
      : null,
  );

  const stepName = currentStep?.name;
  const { sampleData, sampleDataInput } = useBuilderStateContext((state) => ({
    sampleData: stepName ? state.outputSampleData[stepName] : undefined,
    sampleDataInput: stepName ? state.inputSampleData[stepName] : undefined,
  }));

  const cfg = untrack(() => ({
    flowVersionId: props.flowVersionId,
    flowId: props.flowId,
  }));
  const { pollResults } = triggerEventHooks.usePollResults(
    cfg.flowVersionId,
    cfg.flowId,
  );

  const view = () => {
    if (!runner || !currentStep || currentStep.type !== FlowTriggerType.PIECE) {
      return null;
    }

    const {
      pieceModel,
      isPieceLoading,
      testType,
      mockData,
      isValid,
      isSimulating,
      isSavingMockdata,
      isPollingTesting,
      errorMessage,
      isTestingDialogOpen,
      setIsTestingDialogOpen,
      abortControllerRef,
      saveMockAsSampleData,
      resetSimulation,
      fireTest,
    } = runner;

    const lastTestDate = currentStep.settings.sampleData?.lastTestDate;
    const sampleDataSelected = !isNil(lastTestDate) || !isNil(errorMessage);
    const isTestedBefore = !isNil(lastTestDate);
    const showFirstTimeTestingSection = !isTestedBefore && !isSimulating;

    if (isPieceLoading || isNil(testType)) {
      return (
        <div class="flex flex-col h-full">
          <TestPanelHeader status="idle" />
          <div class="flex justify-end px-3 py-2 shrink-0">
            <TestPanelViewToggle />
          </div>
        </div>
      );
    }

    const showSampleDataViewer =
      sampleDataSelected && !isSimulating && !isSavingMockdata;

    const triggerName = currentStep.settings.triggerName;
    const getSimulationNote = () => {
      switch (testType) {
        case 'simulation':
          return t('testPieceWebhookTriggerNote', {
            pieceName: pieceModel?.displayName,
            triggerName: triggerName
              ? pieceModel?.triggers[triggerName]?.displayName
              : undefined,
          });
        case 'webhook':
          return (
            <div class="flex flex-col gap-2">
              <p>
                {t(
                  'Send Data to the webhook URL to generate sample data to use in the next steps',
                )}
              </p>
              <ManualWebhookTestButton
                isWebhookTestingDialogOpen={isTestingDialogOpen}
                setIsWebhookTestingDialogOpen={(open) => {
                  setIsTestingDialogOpen(open);
                  if (!open) {
                    abortControllerRef.current.abort();
                    abortControllerRef.current = new AbortController();
                  }
                }}
              />
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <>
        <Show when={showFirstTimeTestingSection && !errorMessage}>
          <div class="flex flex-col h-full">
            <TestPanelHeader status="idle" />
            <div class="flex justify-end px-3 py-2 shrink-0">
              <TestPanelViewToggle />
            </div>
            <div class="grow flex flex-col items-center justify-center w-full px-6 py-10 gap-4 text-center">
              <div class="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
                <Zap class="size-6" />
              </div>
              <div class="flex flex-col gap-1.5 max-w-[280px]">
                <span class="text-sm font-medium text-foreground">
                  {t('No sample data yet')}
                </span>
                <span class="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    'Test the trigger to capture sample data. You can then use the result in the following steps.',
                  )}
                </span>
              </div>
              <FirstTimeTestingSection
                isValid={isValid}
                testType={testType}
                isTesting={
                  isPollingTesting || isSimulating || isTestingDialogOpen
                }
                mockData={mockData}
                isSaving={props.isSaving || isSavingMockdata}
                onSimulateTrigger={fireTest}
                onPollTrigger={fireTest}
                onMcpToolTesting={fireTest}
                onSaveMockAsSampleData={saveMockAsSampleData}
              />
            </div>
          </div>
        </Show>
        <Show when={!showFirstTimeTestingSection || errorMessage}>
          <>
            <Show when={showSampleDataViewer}>
              <TestSampleDataViewer
                onRetest={fireTest}
                hideCancel={true}
                isValid={isValid}
                consoleLogs={null}
                isTesting={isPollingTesting}
                sampleData={sampleData}
                sampleDataInput={sampleDataInput ?? null}
                errorMessage={errorMessage ?? null}
                lastTestDate={lastTestDate}
                isSaving={props.isSaving}
              >
                <Show when={pollResults && !errorMessage}>
                  <TriggerEventSelect
                    pollResults={pollResults}
                    sampleData={sampleData}
                  />
                </Show>
              </TestSampleDataViewer>
            </Show>

            <Show when={isSimulating}>
              <SimulationNote
                note={getSimulationNote()}
                resetSimulation={resetSimulation}
                abortControllerRef={abortControllerRef}
              />
            </Show>
          </>
        </Show>
      </>
    );
  };

  return <div class="flex flex-col h-full">{view()}</div>;
};

export { TestTriggerSection };
