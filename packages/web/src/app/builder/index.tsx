import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';
import { Show, createEffect, createSignal } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { DataSelector } from '@/app/builder/data-selector';
import { CanvasControls } from '@/app/builder/flow-canvas/canvas-controls';
import { StepSettingsProvider } from '@/app/builder/step-settings/step-settings-context';
import { RightSideBarType } from '@/app/builder/types';
import { ChatDrawer } from '@/app/routes/chat/chat-drawer';
import { ShowPoweredBy } from '@/components/custom/show-powered-by';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { useElementSize } from '@/hooks/use-element-size';
import { cn } from '@/lib/utils';

import { BuilderHeader } from './builder-header/builder-header';
import { FlowCanvas } from './flow-canvas';
import { flowCanvasHooks } from './flow-canvas/hooks';
import { flowCanvasConsts } from './flow-canvas/utils/consts';
import { BuilderBanner } from './flow-canvas/widgets/builder-banner';
import { FlowVersionsList } from './flow-versions';
import { RunsList } from './run-list';
import { CursorPositionProvider } from './state/cursor-position-context';
import { StepSettingsContainer } from './step-settings';
const animateResizeClassName = `transition-all `;

const SPLIT_MODE_INITIAL_OPEN_SIZE_PX = 1000;
const SPLIT_MODE_SIDEBAR_SIZE_PX = 850;
const DEFAULT_SIDEBAR_SIZE = '25%';
const DEFAULT_MIN_SIZE = '400px';
const SPLIT_MODE_COLLAPSE_THRESHOLD_PX = 700;

const BuilderPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [
    flowVersion,
    rightSidebar,
    selectedStepName,
    removeAllStepTestsListeners,
    selectedStep,
    testPanelView,
    isTestPanelOpen,
    setTestPanelView,
    setTestPanelOpen,
  ] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.rightSidebar,
    state.selectedStep,
    state.removeAllStepTestsListeners,
    flowStructureUtil.getStep(
      state.selectedStep ?? '',
      state.flowVersion.trigger,
    ),
    state.testPanelView,
    state.isTestPanelOpen,
    state.setTestPanelView,
    state.setTestPanelOpen,
  ]);
  createEffect(() => {
    return () => {
      removeAllStepTestsListeners();
    };
  });
  flowCanvasHooks.useShowBuilderIsSavingWarningBeforeLeaving();
  let middlePanelRef: HTMLDivElement | undefined;
  const middlePanelSize = useElementSize(middlePanelRef);
  const [isDraggingHandle, setIsDraggingHandle] = createSignal(false);
  createEffect(() => {
    const handlePointerUp = () => setIsDraggingHandle(false);
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  });
  const isSplitForPiece =
    rightSidebar === RightSideBarType.PIECE_SETTINGS &&
    testPanelView === 'split' &&
    isTestPanelOpen;
  const prefersSplitLayout =
    rightSidebar === RightSideBarType.PIECE_SETTINGS &&
    testPanelView === 'split';

  let resizeRightPanel: ((size: string) => void) | undefined;
  let rightSidePanelRef: HTMLDivElement | undefined;
  const [previousRightSidebar, setPreviousRightSidebar] =
    createSignal(rightSidebar);
  createEffect(() => setPreviousRightSidebar(rightSidebar));

  createEffect(() => {
    const resize = resizeRightPanel;
    if (!resize) return;
    if (rightSidebar === RightSideBarType.NONE) {
      resize('0%');
      return;
    }
    const isInitialOpen = previousRightSidebar() === RightSideBarType.NONE;
    const targetSize = prefersSplitLayout
      ? isInitialOpen
        ? SPLIT_MODE_INITIAL_OPEN_SIZE_PX
        : SPLIT_MODE_SIDEBAR_SIZE_PX
      : DEFAULT_SIDEBAR_SIZE;
    resize(targetSize);
    const rafId = window.requestAnimationFrame(() => resize(targetSize));
    return () => window.cancelAnimationFrame(rafId);
  });

  createEffect(() => {
    if (!isSplitForPiece || !isDraggingHandle) return;
    const el = rightSidePanelRef;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0 && width < SPLIT_MODE_COLLAPSE_THRESHOLD_PX) {
        setTestPanelView('drawer');
        setTestPanelOpen(false);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  });
  const { pieceModel, refetch: refetchPiece } =
    piecesHooks.usePieceModelForStepSettings({
      name: getPieceName(selectedStep),
      version: getPieceVersion(selectedStep),
      enabled:
        selectedStep?.type === FlowActionType.PIECE ||
        selectedStep?.type === FlowTriggerType.PIECE,
    });
  flowCanvasHooks.useSetSocketListener(() => {
    void refetchPiece();
  });
  flowCanvasHooks.useListenToExistingRun();

  const [hasCanvasBeenInitialised, setHasCanvasBeenInitialised] =
    createSignal(false);

  return (
    <div class="flex h-full w-full flex-col relative max-h-[100vh]">
      <div class="z-40">
        <BuilderHeader />
      </div>
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel initialSize={1} id="flow-canvas">
          <div
            ref={(el) => (middlePanelRef = el)}
            class="relative h-full w-full"
          >
            <CursorPositionProvider>
              <FlowCanvas
                setHasCanvasBeenInitialised={setHasCanvasBeenInitialised}
              />
            </CursorPositionProvider>

            <BuilderBanner />
            <Show when={middlePanelRef && middlePanelRef.clientWidth > 0}>
              <CanvasControls
                canvasHeight={middlePanelRef?.clientHeight ?? 0}
                canvasWidth={middlePanelRef?.clientWidth ?? 0}
                hasCanvasBeenInitialised={hasCanvasBeenInitialised}
                selectedStep={selectedStepName}
              />
            </Show>

            <ShowPoweredBy
              position="absolute"
              show={platform?.plan.showPoweredBy}
            />
            <DataSelector
              parentHeight={middlePanelSize().height}
              parentWidth={middlePanelSize().width}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle
          disabled={rightSidebar === RightSideBarType.NONE}
          withHandle={rightSidebar !== RightSideBarType.NONE}
          onPointerDown={() => setIsDraggingHandle(true)}
          onPointerUp={() => setIsDraggingHandle(false)}
          onPointerCancel={() => setIsDraggingHandle(false)}
          class={rightSidebar === RightSideBarType.NONE ? 'bg-transparent' : ''}
        />

        <ResizablePanel
          id="right-sidebar"
          collapsedSize={0}
          initialSize={0}
          minSize={
            rightSidebar === RightSideBarType.NONE ? 0 : DEFAULT_MIN_SIZE
          }
          maxSize={
            rightSidebar === RightSideBarType.NONE
              ? 0
              : prefersSplitLayout
              ? 0.95
              : 0.6
          }
          class={cn('min-w-0 bg-background z-30', {
            [animateResizeClassName]: !isDraggingHandle,
          })}
          style={{
            'transition-duration': `${
              isDraggingHandle ? 0 : flowCanvasConsts.SIDEBAR_ANIMATION_DURATION
            }ms`,
          }}
        >
          {(panel) => {
            resizeRightPanel = panel.resize;
            return (
              <div ref={(el) => (rightSidePanelRef = el)} class="h-full w-full">
                <Show
                  when={
                    rightSidebar === RightSideBarType.PIECE_SETTINGS &&
                    selectedStep
                  }
                >
                  <StepSettingsProvider
                    pieceModel={pieceModel}
                    selectedStep={selectedStep}
                    key={constructContainerKey({
                      flowVersionId: flowVersion.id,
                      step: selectedStep,
                      hasPieceModelLoaded: !!pieceModel,
                    })}
                  >
                    <StepSettingsContainer />
                  </StepSettingsProvider>
                </Show>
                <Show when={rightSidebar === RightSideBarType.RUNS}>
                  <RunsList />
                </Show>
                <Show when={rightSidebar === RightSideBarType.VERSIONS}>
                  <FlowVersionsList />
                </Show>
              </div>
            );
          }}
        </ResizablePanel>
      </ResizablePanelGroup>

      <ChatDrawer />
    </div>
  );
};

export { BuilderPage };

function constructContainerKey({
  flowVersionId,
  step,
  hasPieceModelLoaded,
}: {
  flowVersionId: string;
  step?: FlowAction | FlowTrigger;
  hasPieceModelLoaded: boolean;
}) {
  const stepName = step?.name;
  const triggerOrActionName = getTriggerOrActionName(step);
  const pieceName = getPieceName(step);
  const pieceVersion = getPieceVersion(step);
  //we need to re-render the step settings form when the step is skipped, so when the user edits the settings after setting it to skipped the changes are reflected in the update request
  const isSkipped =
    step?.type != FlowTriggerType.EMPTY &&
    step?.type != FlowTriggerType.PIECE &&
    step?.skip;
  return `${flowVersionId}-${stepName ?? ''}-${triggerOrActionName ?? ''}-${
    pieceName ?? ''
  }-${pieceVersion ?? ''}-${'skipped-' + !!isSkipped}-${
    hasPieceModelLoaded ? 'loaded' : 'not-loaded'
  }`;
}

function getTriggerOrActionName(step?: FlowAction | FlowTrigger) {
  if (step?.type === FlowTriggerType.PIECE) {
    return step.settings.triggerName;
  }
  if (step?.type === FlowActionType.PIECE) {
    return step.settings.actionName;
  }
  return undefined;
}

function getPieceName(step?: FlowAction | FlowTrigger) {
  if (
    step?.type === FlowTriggerType.PIECE ||
    step?.type === FlowActionType.PIECE
  ) {
    return step.settings.pieceName;
  }
  return undefined;
}

function getPieceVersion(step?: FlowAction | FlowTrigger) {
  if (
    step?.type === FlowTriggerType.PIECE ||
    step?.type === FlowActionType.PIECE
  ) {
    return step.settings.pieceVersion;
  }
  return undefined;
}
