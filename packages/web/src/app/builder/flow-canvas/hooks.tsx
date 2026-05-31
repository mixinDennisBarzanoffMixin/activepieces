import {
  FlowRunStatus,
  Permission,
  isNil,
  WebsocketClientEvent,
  RunEnvironment,
  isFlowRunStateTerminal,
} from '@activepieces/shared';
import { useDebouncedCallback } from '@/lib/debounce';
import { useLocation } from '@solidjs/router';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { useReactFlow } from './solid-flow-adapter';
import { t } from 'i18next';
import { createEffect, createSignal } from 'solid-js';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useSocket } from '@/components/providers/socket-provider';
import { flowRunsApi, flowRunUtils } from '@/features/flow-runs';
import { flowsApi } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { useBuilderStateContext } from '../builder-hooks';
import { textMentionUtils } from '../piece-properties/text-input-with-mentions/text-input-utils';

import { flowCanvasUtils } from './utils/flow-canvas-utils';

const useSetSocketListener = (refetchPiece: () => void) => {
  const socket = useSocket();
  const [run] = useBuilderStateContext((state) => [state.run]);
  createEffect(() => {
    socket.on(WebsocketClientEvent.REFRESH_PIECE, () => {
      refetchPiece();
    });
    return () => {
      socket.removeAllListeners(WebsocketClientEvent.REFRESH_PIECE);
    };
  });
};

const useListenToExistingRun = () => {
  const [run, setRun, flowVersion] = useBuilderStateContext((state) => [
    state.run,
    state.setRun,
    state.flowVersion,
  ]);
  const location = useLocation();
  const inRunsPage = location.pathname?.includes('/runs');
  createQuery(() => ({
    queryKey: ['refetched-run', run?.id],
    queryFn: async () => {
      if (isNil(run)) {
        return null;
      }
      const flowRun = await flowRunsApi.getPopulated(run.id);
      setRun(flowRun, flowVersion);
    },
    enabled:
      !isNil(run) &&
      run.environment === RunEnvironment.PRODUCTION &&
      !isFlowRunStateTerminal({
        status: run.status,
        ignoreInternalError: false,
      }) &&
      inRunsPage,
    refetchInterval: 5000,
  }));
};

const useShowBuilderIsSavingWarningBeforeLeaving = () => {
  const {
    embedState: { isEmbedded },
  } = useEmbedding();
  const isSaving = useBuilderStateContext((state) => state.saving);
  createEffect(() => {
    if (isEmbedded) {
      return;
    }
    const message = t(
      'Leaving this page while saving will discard your changes, are you sure you want to leave?',
    );
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSaving) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    if (isSaving) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });
};

export const useSwitchToDraft = () => {
  const [flowVersion, setVersion, clearRun, setFlow] = useBuilderStateContext(
    (state) => [
      state.flowVersion,
      state.setVersion,
      state.clearRun,
      state.setFlow,
    ],
  );
  const socket = useSocket();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToEditFlow = checkAccess(Permission.WRITE_FLOW);

  const { mutate: switchToDraft, isPending: isSwitchingToDraftPending } =
    createMutation(() => ({
      mutationFn: async () => {
        const flow = await flowsApi.get(flowVersion.flowId);
        return flow;
      },
      onSuccess: (flow) => {
        setFlow(flow);
        setVersion(flow.version);
        clearRun(userHasPermissionToEditFlow);
        socket.removeAllListeners(WebsocketClientEvent.UPDATE_RUN_PROGRESS);
      },
    }));
  return {
    switchToDraft,
    isSwitchingToDraftPending,
  };
};

const useIsFocusInsideListMapperModeInput = ({
  containerRef,
  setIsFocusInsideListMapperModeInput,
  isFocusInsideListMapperModeInput,
}: {
  containerRef: HTMLDivElement | null | undefined;
  setIsFocusInsideListMapperModeInput: (
    isFocusInsideListMapperModeInput: boolean,
  ) => void;
  isFocusInsideListMapperModeInput: boolean;
}) => {
  createEffect(() => {
    const focusInListener = () => {
      const focusedElement = document.activeElement;
      const isFocusedInside = !!containerRef.current?.contains(focusedElement);
      const isFocusedInsideDataSelector =
        !isNil(document.activeElement) &&
        document.activeElement instanceof HTMLElement &&
        textMentionUtils.isDataSelectorOrChildOfDataSelector(
          document.activeElement,
        );
      setIsFocusInsideListMapperModeInput(
        isFocusedInside ||
          (isFocusedInsideDataSelector && isFocusInsideListMapperModeInput),
      );
    };
    document.addEventListener('focusin', focusInListener);
    return () => {
      document.removeEventListener('focusin', focusInListener);
    };
  });
};
export const useFocusOnStep = () => {
  const [currentRun, selectStep, userManuallySelectedStepDuringRun] =
    useBuilderStateContext((state) => [
      state.run,
      state.selectStepByName,
      state.userManuallySelectedStepDuringRun,
    ]);

  const [previousStatus, setPreviousStatus] = createSignal(currentRun?.status);
  createEffect(() => setPreviousStatus(currentRun?.status));
  const currentStep = flowRunUtils.findLastStepWithStatus(
    previousStatus() ?? FlowRunStatus.RUNNING,
    currentRun?.steps ?? {},
  );

  const { fitView } = useReactFlow();
  const focusCurrentStep = useDebouncedCallback(() => {
    if (userManuallySelectedStepDuringRun) {
      return;
    }
    if (!isNil(currentStep)) {
      fitView(flowCanvasUtils.createFocusStepInGraphParams(currentStep));
      selectStep(currentStep, { fromAutoFocus: true });
    }
  }, 500);

  createEffect(() => {
    focusCurrentStep();
  });
};

export const useResizeCanvas = (
  containerRef: HTMLDivElement | null | undefined,
  setHasCanvasBeenInitialised: (hasCanvasBeenInitialised: boolean) => void,
) => {
  let containerSizeRef: any | undefined;
  const { getViewport, setViewport } = useReactFlow();

  createEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setHasCanvasBeenInitialised(true);
      const { x, y, zoom } = getViewport();
      if (containerRef.current && width !== containerSizeRef.width) {
        const newX = x + (width - containerSizeRef.width) / 2;
        setViewport({ x: newX, y, zoom });
      }
      containerSizeRef = {
        width,
        height,
      };
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  });
};

export const flowCanvasHooks = {
  useSetSocketListener,
  useShowBuilderIsSavingWarningBeforeLeaving,
  useIsFocusInsideListMapperModeInput,
  useFocusOnStep,
  useResizeCanvas,
  useSwitchToDraft,
  useListenToExistingRun,
};
