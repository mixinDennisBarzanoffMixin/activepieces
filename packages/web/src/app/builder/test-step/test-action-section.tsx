import {
  FlowAction,
  FlowActionType,
  Step,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { FlaskConical, Play } from 'lucide-solid';
import { Show, createMemo, useContext } from 'solid-js';

import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../builder-hooks';
import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import { TestPanelHeader } from './test-panel-header';
import { TestPanelViewToggle } from './test-panel-view-toggle';
import { useActionTestRunner } from './test-runner-context';
import { TestSampleDataViewer } from './test-sample-data-viewer';
import { TestButtonTooltip } from './test-step-tooltip';

const TestStepSectionImplementation = (
  props: TestActionComponentProps & { currentStep: FlowAction },
) => {
  const [
    sampleData,
    sampleDataInput,
    errorMessage,
    consoleLogs,
    isStepBeingTested,
    removeStepTestListener,
    revertSampleDataLocally,
  ] = useBuilderStateContext((state) => {
    return [
      state.outputSampleData[props.currentStep.name],
      state.inputSampleData[props.currentStep.name],
      state.errorLogs[props.currentStep.name],
      props.currentStep.type === FlowActionType.CODE
        ? state.consoleLogs[props.currentStep.name]
        : null,
      state.isStepBeingTested,
      state.removeStepTestListener,
      state.revertSampleDataLocallyCallbacks[props.currentStep.name],
    ];
  });

  const runner = useActionTestRunner();
  const onTestButtonClick = () => runner?.fireTest();

  const date = createMemo(
    () => props.currentStep.settings.sampleData?.lastTestDate,
  );

  const exists = createMemo(
    () =>
      !isNil(date()) ||
      !isNil(errorMessage) ||
      isStepBeingTested(props.currentStep.name),
  );

  const isTesting = runner?.isTesting ?? false;
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);

  return (
    <>
      <Show when={!exists() && !isTesting}>
        <div class="flex flex-col h-full">
          <TestPanelHeader status="idle" />
          <div class="flex justify-end px-3 py-2 shrink-0">
            <TestPanelViewToggle />
          </div>
          <div class="grow flex flex-col items-center justify-center w-full px-6 py-10 gap-4 text-center">
            <div class="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
              <FlaskConical class="size-6" />
            </div>
            <div class="flex flex-col gap-1.5 max-w-[280px]">
              <span class="text-sm font-medium text-foreground">
                {t('No sample data yet')}
              </span>
              <span class="text-xs text-muted-foreground leading-relaxed">
                {t(
                  'Run this step to capture sample data. You can then use the result in following steps.',
                )}
              </span>
            </div>
            <TestButtonTooltip
              saving={props.isSaving}
              invalid={!props.currentStep.valid}
            >
              <Button
                size="sm"
                onClick={onTestButtonClick}
                loading={isTesting || props.isSaving}
                disabled={
                  !props.currentStep.valid || isLoadingDynamicProperties
                }
                class="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Play class="size-3.5 fill-current" />
                {t('Test Step')}
              </Button>
            </TestButtonTooltip>
          </div>
        </div>
      </Show>
      <Show when={exists() || isTesting}>
        <TestSampleDataViewer
          isValid={props.currentStep.valid && !isLoadingDynamicProperties}
          currentStep={props.currentStep}
          isTesting={isTesting}
          sampleData={sampleData}
          sampleDataInput={sampleDataInput ?? null}
          lastTestDate={date()}
          isSaving={props.isSaving}
          onRetest={onTestButtonClick}
          errorMessage={errorMessage}
          consoleLogs={consoleLogs}
          onCancelTesting={() => {
            removeStepTestListener(props.currentStep.name);
            revertSampleDataLocally?.();
          }}
        />
      </Show>
    </>
  );
};

const isAction = (step: Step): step is FlowAction => {
  return flowStructureUtil.isAction(step.type);
};
const TestActionSection = (props: TestActionComponentProps) => {
  const currentStep = useBuilderStateContext((state) =>
    state.selectedStep
      ? flowStructureUtil.getStep(state.selectedStep, state.flowVersion.trigger)
      : null,
  );
  const action = createMemo(() => {
    if (isNil(currentStep) || !isAction(currentStep)) return;
    return currentStep;
  });

  return (
    <Show when={action()} keyed>
      {(current) => (
        <TestStepSectionImplementation {...props} currentStep={current} />
      )}
    </Show>
  );
};

type TestActionComponentProps = {
  isSaving: boolean;
  flowVersionId: string;
  projectId: string;
};

export { TestActionSection };
