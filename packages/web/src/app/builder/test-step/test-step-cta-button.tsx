import {
  FlowAction,
  FlowTrigger,
  FlowTriggerType,
  Step,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Play } from 'lucide-solid';
import { createEffect, createMemo, JSX, Show, useContext } from 'solid-js';
import { toast } from 'solid-sonner';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { pieceSelectorUtils } from '@/features/pieces';

import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import {
  useActionTestRunner,
  useTriggerTestRunner,
} from './test-runner-context';
import { TestButtonTooltip } from './test-step-tooltip';

const SOFT_PRIMARY_CTA_CLASSES =
  'w-full justify-center bg-primary/5 enabled:hover:bg-primary/15 enabled:hover:text-primary text-primary border-primary/20';

const TestStepCTAButton = () => {
  const [
    selectedStep,
    flowVersion,
    isStepBeingTested,
    setTestPanelOpen,
    run,
    saving,
  ] = useBuilderStateContext((state) => [
    state.selectedStep,
    state.flowVersion,
    state.isStepBeingTested,
    state.setTestPanelOpen,
    state.run,
    state.saving,
  ]);

  const step = createMemo(() =>
    selectedStep
      ? flowStructureUtil.getStep(selectedStep, flowVersion.trigger)
      : undefined,
  );

  const action = createMemo(() => {
    const current = step();
    if (current && isFlowAction(current)) return current;
  });

  const trigger = createMemo(() => {
    const current = step();
    if (!current || !isPieceTrigger(current)) return;
    if (
      pieceSelectorUtils.isManualTrigger({
        pieceName: current.settings.pieceName,
        triggerName: current.settings.triggerName,
      })
    ) {
      return;
    }
    return current;
  });

  const onOpenPanel = () => setTestPanelOpen(true);

  return (
    <>
      <Show when={action()} keyed>
        {(current) => (
          <ActionCTAButton
            currentStep={current}
            sampleDataExists={!isNil(getLastTestDate(current.settings))}
            onOpenPanel={onOpenPanel}
            saving={saving}
            hasRun={!isNil(run)}
          />
        )}
      </Show>
      <Show when={trigger()} keyed>
        {(current) => (
          <TriggerCTAButton
            sampleDataExists={!isNil(getLastTestDate(current.settings))}
            stepIsRunning={isStepBeingTested(current.name)}
            stepIsValid={current.valid !== false}
            onOpenPanel={onOpenPanel}
            saving={saving}
            hasRun={!isNil(run)}
          />
        )}
      </Show>
    </>
  );
};

const isFlowAction = (step: Step): step is FlowAction =>
  flowStructureUtil.isAction(step.type);

const isPieceTrigger = (
  step: Step,
): step is Extract<FlowTrigger, { type: FlowTriggerType.PIECE }> =>
  step.type === FlowTriggerType.PIECE;

type ActionCTAButtonProps = {
  currentStep: FlowAction;
  sampleDataExists: boolean;
  onOpenPanel: () => void;
  saving: boolean;
  hasRun: boolean;
};

const ActionCTAButton = (props: ActionCTAButtonProps) => {
  const valid = createMemo(() => props.currentStep.valid !== false);
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const runner = useActionTestRunner();
  useConfigureStepShortcutToast(() => valid());

  const fireTest = () => {
    props.onOpenPanel();
    runner?.fireTest();
  };

  return (
    <Show
      when={props.hasRun}
      fallback={
        <Show
          when={props.sampleDataExists}
          fallback={
            <CTAShell>
              <TestButtonTooltip saving={props.saving} invalid={!valid()}>
                <Button
                  variant="outline"
                  onClick={fireTest}
                  disabled={
                    !valid() || props.saving || isLoadingDynamicProperties
                  }
                  keyboardShortcut="G"
                  onKeyboardShortcut={fireTest}
                  class={SOFT_PRIMARY_CTA_CLASSES}
                  size="sm"
                >
                  <Play class="size-4 fill-current" />
                  {t('Test Step')}
                </Button>
              </TestButtonTooltip>
            </CTAShell>
          }
        >
          <CTAShell>
            <Button
              variant="outline"
              onClick={props.onOpenPanel}
              disabled={props.saving}
              class="w-full justify-center"
              size="sm"
            >
              {t('Show Sample Data')}
            </Button>
            <TestButtonTooltip saving={props.saving} invalid={!valid()}>
              <Button
                variant="outline"
                onClick={fireTest}
                disabled={
                  !valid() || props.saving || isLoadingDynamicProperties
                }
                keyboardShortcut="G"
                onKeyboardShortcut={fireTest}
                class={SOFT_PRIMARY_CTA_CLASSES}
                size="sm"
              >
                <Play class="size-4 fill-current" />
                {t('Retest Step')}
              </Button>
            </TestButtonTooltip>
          </CTAShell>
        </Show>
      }
    >
      <CTAShell>
        <TestButtonTooltip saving={props.saving} invalid={false}>
          <Button
            variant="outline"
            onClick={props.onOpenPanel}
            disabled={props.saving}
            class={SOFT_PRIMARY_CTA_CLASSES}
            size="sm"
          >
            {t('Show Output')}
          </Button>
        </TestButtonTooltip>
      </CTAShell>
    </Show>
  );
};

type TriggerCTAButtonProps = {
  sampleDataExists: boolean;
  stepIsRunning: boolean;
  stepIsValid: boolean;
  onOpenPanel: () => void;
  saving: boolean;
  hasRun: boolean;
};

const TriggerCTAButton = (props: TriggerCTAButtonProps) => {
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const runner = useTriggerTestRunner();
  const disabled = createMemo(
    () =>
      !props.stepIsValid ||
      props.saving ||
      isLoadingDynamicProperties ||
      props.stepIsRunning ||
      !!runner?.isTesting ||
      !runner?.canFireTest,
  );
  useConfigureStepShortcutToast(() => props.stepIsValid);

  const fireTest = () => {
    props.onOpenPanel();
    runner?.fireTest();
  };

  return (
    <Show
      when={props.hasRun}
      fallback={
        <Show
          when={props.sampleDataExists}
          fallback={
            <CTAShell>
              <TestButtonTooltip
                saving={props.saving}
                invalid={!props.stepIsValid}
              >
                <Button
                  variant="outline"
                  onClick={fireTest}
                  disabled={disabled()}
                  keyboardShortcut="G"
                  onKeyboardShortcut={fireTest}
                  class={SOFT_PRIMARY_CTA_CLASSES}
                  size="sm"
                  data-testid="test-trigger-button"
                >
                  <Play class="size-4 fill-current" />
                  {t('Test Trigger')}
                </Button>
              </TestButtonTooltip>
            </CTAShell>
          }
        >
          <CTAShell>
            <Button
              variant="outline"
              onClick={props.onOpenPanel}
              disabled={props.saving}
              class="w-full justify-center"
              size="sm"
            >
              {t('Show Sample Data')}
            </Button>
            <TestButtonTooltip
              saving={props.saving}
              invalid={!props.stepIsValid}
            >
              <Button
                variant="outline"
                onClick={fireTest}
                disabled={disabled()}
                keyboardShortcut="G"
                onKeyboardShortcut={fireTest}
                class={SOFT_PRIMARY_CTA_CLASSES}
                size="sm"
              >
                <Play class="size-4 fill-current" />
                {t('Retest Trigger')}
              </Button>
            </TestButtonTooltip>
          </CTAShell>
        </Show>
      }
    >
      <CTAShell>
        <Button
          variant="outline"
          onClick={props.onOpenPanel}
          disabled={props.saving}
          class={SOFT_PRIMARY_CTA_CLASSES}
          size="sm"
        >
          {t('Show Output')}
        </Button>
      </CTAShell>
    </Show>
  );
};

const useConfigureStepShortcutToast = (valid: () => boolean) => {
  createEffect(() => {
    if (valid()) return;
    const isMac = /(Mac)/i.test(navigator.userAgent);
    const onKeyDown = (e: KeyboardEvent) => {
      const isCtrlG =
        e.key.toLowerCase() === 'g' && (isMac ? e.metaKey : e.ctrlKey);
      if (!isCtrlG) return;
      toast.error(t('Configure step first'));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });
};

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
  return settings.sampleData.lastTestDate;
}

const CTAShell = (props: { children: JSX.Element }) => (
  <div
    data-test-panel-trigger
    class="relative px-3 py-3 bg-background z-10 flex flex-col gap-2 shrink-0"
  >
    <div
      aria-hidden
      class="pointer-events-none absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent"
    />
    {props.children}
  </div>
);

export { TestStepCTAButton };
