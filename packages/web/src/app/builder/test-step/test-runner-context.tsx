import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import { Show, createContext, createSignal, useContext } from 'solid-js';

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

const ActionTestRunnerProvider = ({
  step,
  children,
}: ActionTestRunnerProviderProps) => {
  const { mutate: testAction, isPending: isWaitingTestResult } =
    testStepHooks.useTestAction({ currentStep: step });
  const isStepBeingTested = useBuilderStateContext(
    (state) => state.isStepBeingTested,
  );
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const [showWebhookDialog, setShowWebhookDialog] = createSignal(false);

  const isTesting =
    isWaitingTestResult || isStepBeingTested(step.name) || showWebhookDialog;

  const canFireTest =
    step.valid !== false && !isTesting && !isLoadingDynamicProperties;

  const fireTest = () => {
    if (!canFireTest) return;
    if (isReturnResponseAndWaitForWebhook(step)) {
      setShowWebhookDialog(true);
    } else {
      testAction(undefined);
    }
  };

  return (
    <ActionTestRunnerContext.Provider
      value={{ fireTest, isTesting, canFireTest }}
    >
      {children}
      <Show when={showWebhookDialog()}>
        <TestWebhookDialog
          testingMode="returnResponseAndWaitForNextWebhook"
          open={true}
          onOpenChange={(open) => !open && setShowWebhookDialog(false)}
          currentStep={step}
        />
      </Show>
    </ActionTestRunnerContext.Provider>
  );
};

const useActionTestRunner = () => useContext(ActionTestRunnerContext);

ActionTestRunnerProvider.displayName = 'ActionTestRunnerProvider';

const TriggerTestRunnerContext =
  createContext<TriggerTestRunnerContextValue | null>(null);

const TriggerTestRunnerProvider = ({
  step,
  children,
}: TriggerTestRunnerProviderProps) => {
  const [errorMessage, setErrorMessage] = createSignal<string | undefined>(
    undefined,
  );
  const [isTestingDialogOpen, setIsTestingDialogOpen] = createSignal(false);
  let abortControllerRef: AbortController | undefined;

  const [setChatDrawerOpenSource, flowVersionId] = useBuilderStateContext(
    (state) => [state.setChatDrawerOpenSource, state.flowVersion.id],
  );
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const queryClient = useQueryClient();

  const isPieceTrigger = step.type === FlowTriggerType.PIECE;
  const pieceName = isPieceTrigger ? step.settings.pieceName : '';
  const pieceVersion = isPieceTrigger ? step.settings.pieceVersion : undefined;
  const triggerName = isPieceTrigger ? step.settings.triggerName : undefined;

  const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
    name: pieceName,
    version: pieceVersion,
    enabled: isPieceTrigger && !!pieceName,
  });

  const trigger = triggerName ? pieceModel?.triggers?.[triggerName] : undefined;
  const mockData = trigger?.sampleData;

  const testType: TestType | null =
    trigger && triggerName && pieceName
      ? triggerEventUtils.getTestType({ triggerName, pieceName, trigger })
      : null;

  const isManualTrigger =
    pieceName && triggerName
      ? pieceSelectorUtils.isManualTrigger({ pieceName, triggerName })
      : false;

  const onTestSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['triggerEvents', flowVersionId],
    });
  };

  const { mutate: saveMockAsSampleData, isPending: isSavingMockdata } =
    testStepHooks.useSaveMockData({
      onSuccess: onTestSuccess,
    });

  const {
    mutate: simulateTrigger,
    isPending: isSimulating,
    reset: resetSimulation,
  } = testStepHooks.useSimulateTrigger({
    setErrorMessage,
    onSuccess: async () => {
      await onTestSuccess();
      setIsTestingDialogOpen(false);
    },
  });

  const { mutate: pollTrigger, isPending: isPollingTesting } =
    testStepHooks.usePollTrigger({
      setErrorMessage,
      onSuccess: onTestSuccess,
    });

  const isTesting =
    isSimulating || isPollingTesting || isSavingMockdata || isTestingDialogOpen;

  const isValid = step.valid !== false;
  const canFireTest =
    isValid &&
    !isTesting &&
    !isLoadingDynamicProperties &&
    !isPieceLoading &&
    !isManualTrigger &&
    testType !== null;

  const fireTest = () => {
    if (!canFireTest || !testType) return;
    switch (testType) {
      case 'chat-trigger':
        setChatDrawerOpenSource(ChatDrawerSource.TEST_STEP);
        simulateTrigger(abortControllerRef.signal);
        break;
      case 'simulation':
      case 'webhook':
        simulateTrigger(abortControllerRef.signal);
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
        step,
        pieceModel,
        isPieceLoading,
        testType,
        mockData,
        isValid,
        canFireTest,
        isTesting,
        isSimulating,
        isSavingMockdata,
        isPollingTesting,
        errorMessage,
        setErrorMessage,
        isTestingDialogOpen,
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
      {children}
      <Show when={testType === 'mcp-tool'()}>
        <McpToolTestingDialog
          open={isTestingDialogOpen}
          onOpenChange={setIsTestingDialogOpen}
          onTestingSuccess={onTestSuccess}
        />
      </Show>
    </TriggerTestRunnerContext.Provider>
  );
};

const useTriggerTestRunner = () => useContext(TriggerTestRunnerContext);

TriggerTestRunnerProvider.displayName = 'TriggerTestRunnerProvider';

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
  children: any;
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
  abortControllerRef: AbortController | undefined;
  simulateTrigger: (signal: AbortSignal) => void;
  pollTrigger: () => void;
  saveMockAsSampleData: (mockData: unknown) => void;
  resetSimulation: () => void;
  fireTest: () => void;
  onTestSuccess: () => Promise<void>;
};

type TriggerTestRunnerProviderProps = {
  step: FlowTrigger;
  children: any;
};
