import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import {
  JSX,
  Show,
  createContext,
  createMemo,
  createSignal,
  untrack,
  useContext,
} from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ChatDrawerSource } from '@/app/builder/types';
import { pieceSelectorUtils, piecesHooks } from '@/features/pieces';

import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import { McpToolTestingDialog } from './custom-test-step/mcp-tool-testing-dialog';
import TestWebhookDialog from './custom-test-step/test-webhook-dialog';
import {
  TestType,
  triggerEventUtils,
} from './test-trigger-section/trigger-event-utils';
import { testStepHooks } from './utils/test-step-hooks';

const ActionTestRunnerContext =
  createContext<ActionTestRunnerContextValue | null>(null);

const isReturnResponseAndWaitForWebhook = (step: FlowAction) =>
  step.type === FlowActionType.PIECE &&
  step.settings.pieceName === '@activepieces/piece-webhook' &&
  step.settings.actionName === 'return_response_and_wait_for_next_webhook';

const isPieceTrigger = (
  step: FlowTrigger,
): step is Extract<FlowTrigger, { type: FlowTriggerType.PIECE }> =>
  step.type === FlowTriggerType.PIECE;

const ActionTestRunnerProvider = (props: ActionTestRunnerProviderProps) => {
  const { mutate: testAction, isPending: isWaitingTestResult } =
    testStepHooks.useTestAction({ currentStep: untrack(() => props.step) });
  const isStepBeingTested = useBuilderStateContext((state) => ({
    value: state.isStepBeingTested,
  })).value;
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const [showWebhookDialog, setShowWebhookDialog] = createSignal(false);

  const testing = createMemo(
    () =>
      isWaitingTestResult ||
      isStepBeingTested(props.step.name) ||
      showWebhookDialog(),
  );

  const fireable = createMemo(
    () =>
      props.step.valid !== false && !testing() && !isLoadingDynamicProperties,
  );

  const fireTest = () => {
    if (!fireable()) return;
    if (isReturnResponseAndWaitForWebhook(props.step)) {
      setShowWebhookDialog(true);
      return;
    }
    testAction(undefined);
  };

  return (
    <ActionTestRunnerContext.Provider
      value={{
        fireTest,
        get isTesting() {
          return testing();
        },
        get canFireTest() {
          return fireable();
        },
      }}
    >
      {props.children}
      <Show when={showWebhookDialog()}>
        <TestWebhookDialog
          testingMode="returnResponseAndWaitForNextWebhook"
          open={true}
          onOpenChange={(open) => !open && setShowWebhookDialog(false)}
          currentStep={props.step}
        />
      </Show>
    </ActionTestRunnerContext.Provider>
  );
};

const useActionTestRunner = () => useContext(ActionTestRunnerContext);

const TriggerTestRunnerContext =
  createContext<TriggerTestRunnerContextValue | null>(null);

const TriggerTestRunnerProvider = (props: TriggerTestRunnerProviderProps) => {
  const [errorMessage, setErrorMessage] = createSignal<string | undefined>(
    undefined,
  );
  const [isTestingDialogOpen, setIsTestingDialogOpen] = createSignal(false);
  const abortControllerRef = { current: new AbortController() };

  const [setChatDrawerOpenSource, flowVersionId] = useBuilderStateContext(
    (state) => [state.setChatDrawerOpenSource, state.flowVersion.id],
  );
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const queryClient = useQueryClient();

  const piece = createMemo(() =>
    isPieceTrigger(props.step) ? props.step : undefined,
  );
  const pieceName = createMemo(() => piece()?.settings.pieceName);
  const pieceVersion = createMemo(() => piece()?.settings.pieceVersion);
  const triggerName = createMemo(() => piece()?.settings.triggerName);

  const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
    name: untrack(() => pieceName() || ''),
    version: untrack(pieceVersion),
    enabled: untrack(() => !!pieceName()),
  });

  const trigger = createMemo(() => {
    const name = triggerName();
    if (!name) return;
    return pieceModel?.triggers[name];
  });
  const mockData = createMemo(() => trigger()?.sampleData);

  const testType = createMemo<TestType | null>(() => {
    const current = trigger();
    const name = triggerName();
    const piece = pieceName();
    if (!current || !name || !piece) return null;
    return triggerEventUtils.getTestType({
      triggerName: name,
      pieceName: piece,
      trigger: current,
    });
  });

  const manual = createMemo(() => {
    const piece = pieceName();
    const name = triggerName();
    if (!piece || !name) return false;
    return pieceSelectorUtils.isManualTrigger({
      pieceName: piece,
      triggerName: name,
    });
  });

  const onTestSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['triggerEvents', flowVersionId],
    });
  };

  const { mutate: saveMockAsSampleData, isPending: isSavingMockdata } =
    testStepHooks.useSaveMockData({
      onSuccess: () => void onTestSuccess(),
    });

  const {
    mutate: simulateTrigger,
    isPending: isSimulating,
    reset: resetSimulation,
  } = testStepHooks.useSimulateTrigger({
    setErrorMessage,
    onSuccess: () => {
      void onTestSuccess();
      setIsTestingDialogOpen(false);
    },
  });

  const { mutate: pollTrigger, isPending: isPollingTesting } =
    testStepHooks.usePollTrigger({
      setErrorMessage,
      onSuccess: () => void onTestSuccess(),
    });

  const testing = createMemo(
    () =>
      isSimulating ||
      isPollingTesting ||
      isSavingMockdata ||
      isTestingDialogOpen(),
  );

  const valid = createMemo(() => props.step.valid !== false);
  const fireable = createMemo(
    () =>
      valid() &&
      !testing() &&
      !isLoadingDynamicProperties &&
      !isPieceLoading &&
      !manual() &&
      testType() !== null,
  );

  const fireTest = () => {
    const type = testType();
    if (!fireable() || !type) return;
    switch (type) {
      case 'chat-trigger':
        setChatDrawerOpenSource(ChatDrawerSource.TEST_STEP);
        simulateTrigger(abortControllerRef.current.signal);
        break;
      case 'simulation':
      case 'webhook':
        simulateTrigger(abortControllerRef.current.signal);
        break;
      case 'polling':
        pollTrigger();
        break;
      case 'mcp-tool':
        setIsTestingDialogOpen(true);
        break;
    }
  };

  return (
    <TriggerTestRunnerContext.Provider
      value={{
        get step() {
          return props.step;
        },
        get pieceModel() {
          return pieceModel;
        },
        get isPieceLoading() {
          return isPieceLoading;
        },
        get testType() {
          return testType();
        },
        get mockData() {
          return mockData();
        },
        get isValid() {
          return valid();
        },
        get canFireTest() {
          return fireable();
        },
        get isTesting() {
          return testing();
        },
        get isSimulating() {
          return isSimulating;
        },
        get isSavingMockdata() {
          return isSavingMockdata;
        },
        get isPollingTesting() {
          return isPollingTesting;
        },
        get errorMessage() {
          return errorMessage();
        },
        setErrorMessage,
        get isTestingDialogOpen() {
          return isTestingDialogOpen();
        },
        setIsTestingDialogOpen,
        abortControllerRef,
        simulateTrigger,
        pollTrigger,
        saveMockAsSampleData,
        resetSimulation,
        fireTest,
        onTestSuccess,
      }}
    >
      {props.children}
      <Show when={testType() === 'mcp-tool'}>
        <McpToolTestingDialog
          open={isTestingDialogOpen()}
          onOpenChange={setIsTestingDialogOpen}
          onTestingSuccess={() => void onTestSuccess()}
        />
      </Show>
    </TriggerTestRunnerContext.Provider>
  );
};

const useTriggerTestRunner = () => useContext(TriggerTestRunnerContext);

export {
  ActionTestRunnerProvider,
  useActionTestRunner,
  TriggerTestRunnerProvider,
  useTriggerTestRunner,
};

type ActionTestRunnerContextValue = {
  fireTest: () => void;
  isTesting: boolean;
  canFireTest: boolean;
};

type ActionTestRunnerProviderProps = {
  step: FlowAction;
  children: JSX.Element;
};

type TriggerTestRunnerContextValue = {
  step: FlowTrigger;
  pieceModel: ReturnType<typeof piecesHooks.usePiece>['pieceModel'];
  isPieceLoading: boolean;
  testType: TestType | null;
  mockData: unknown;
  isValid: boolean;
  canFireTest: boolean;
  isTesting: boolean;
  isSimulating: boolean;
  isSavingMockdata: boolean;
  isPollingTesting: boolean;
  errorMessage: string | undefined;
  setErrorMessage: (msg: string | undefined) => void;
  isTestingDialogOpen: boolean;
  setIsTestingDialogOpen: (open: boolean) => void;
  abortControllerRef: { current: AbortController };
  simulateTrigger: (signal: AbortSignal) => void;
  pollTrigger: () => void;
  saveMockAsSampleData: (mockData: unknown) => void;
  resetSimulation: () => void;
  fireTest: () => void;
  onTestSuccess: () => Promise<void>;
};

type TriggerTestRunnerProviderProps = {
  step: FlowTrigger;
  children: JSX.Element;
};
