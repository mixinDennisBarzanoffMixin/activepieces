import { t } from 'i18next';
import {
  Fullscreen,
  Hand,
  Map,
  Minus,
  MousePointer,
  Plus,
  StickyNote,
} from 'lucide-solid';
import { Show, createEffect } from 'solid-js';
import type { JSX } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { isMac } from '@/lib/dom-utils';

import { useBuilderStateContext } from '../builder-hooks';
import { NoteDragOverlayMode } from '../state/notes-state';

import { Node, useKeyPress, useReactFlow } from './solid-flow-adapter';
import { flowCanvasConsts } from './utils/consts';
import { flowCanvasUtils } from './utils/flow-canvas-utils';
import { ApNode, ApNodeType } from './utils/types';
const verticalPaddingOnFitView = 100;
const calculateNodePositionInCanvas = (
  canvasWidth: number,
  node: Node,
  zoom: number,
) => ({
  x:
    node.position.x +
    canvasWidth / 2 -
    (flowCanvasConsts.AP_NODE_SIZE.STEP.width * zoom) / 2,
  y:
    node.position.y +
    flowCanvasConsts.AP_NODE_SIZE.GRAPH_END_WIDGET.height +
    verticalPaddingOnFitView * zoom,
});

// Check if the node is out of view
const isNodeOutOfView = (
  nodePosition: { x: number; y: number },
  canvas: { width: number; height: number },
) =>
  nodePosition.y > canvas.height ||
  nodePosition.x > canvas.width ||
  nodePosition.x < 0;

const calculateViewportDelta = (
  nodePosition: { x: number; y: number },
  canvas: { width: number; height: number },
) => ({
  x:
    nodePosition.x > canvas.width
      ? -1 *
        (nodePosition.x -
          canvas.width +
          flowCanvasConsts.AP_NODE_SIZE.STEP.width * 2)
      : nodePosition.x < 0
      ? -1 * nodePosition.x
      : 0,
  y:
    nodePosition.y > canvas.height
      ? nodePosition.y -
        canvas.height +
        flowCanvasConsts.AP_NODE_SIZE.STEP.height
      : 0,
});

const CanvasControls = (props: {
  canvasWidth: number;
  canvasHeight: number;
  hasCanvasBeenInitialised: boolean;
  selectedStep: string | null;
}) => {
  const { zoomIn, zoomOut, setViewport, getNodes, getNode, getViewport } =
    useReactFlow();
  const handleZoomIn = () => {
    void zoomIn({
      duration: 0,
    });
  };

  const handleZoomOut = () => {
    void zoomOut({
      duration: 0,
    });
  };

  const handleFitToView = (isInitialRenderCall: boolean) => {
    const nodes = getNodes().filter(isApNode);
    if (nodes.length === 0) return;
    const graphHeight = flowCanvasUtils.calculateGraphBoundingBox({
      nodes,
      edges: [],
    }).height;
    const zoomRatio = Math.min(
      Math.max(props.canvasHeight / graphHeight, 0.9),
      1.25,
    );

    void setViewport(
      {
        x:
          props.canvasWidth / 2 -
          (flowCanvasConsts.AP_NODE_SIZE.STEP.width * zoomRatio) / 2,
        y:
          nodes[0].position.y +
          verticalPaddingOnFitView * zoomRatio +
          flowCanvasConsts.AP_NODE_SIZE.STEP.height,
        zoom: zoomRatio,
      },
      {
        duration: isInitialRenderCall ? 0 : 500,
      },
    );
  };

  createEffect(() => {
    if (!props.hasCanvasBeenInitialised) return;

    handleFitToView(true);

    if (props.selectedStep) {
      adjustViewportForSelectedStep(props.selectedStep);
    }
  });

  // Helper function to adjust the viewport for the selected step
  const adjustViewportForSelectedStep = (stepId: string) => {
    const node = getNode(stepId);
    if (!node) return;

    const viewport = getViewport();

    const canvas = {
      height: props.canvasHeight / viewport.zoom,
      width: props.canvasWidth / viewport.zoom,
    };

    const nodePositionInRelationToCanvas = calculateNodePositionInCanvas(
      props.canvasWidth,
      node,
      viewport.zoom,
    );

    if (isNodeOutOfView(nodePositionInRelationToCanvas, canvas)) {
      const delta = calculateViewportDelta(
        nodePositionInRelationToCanvas,
        canvas,
      );

      void setViewport({
        x: viewport.x + delta.x,
        y: viewport.y - delta.y - flowCanvasConsts.AP_NODE_SIZE.STEP.height,
        zoom: viewport.zoom,
      });
    }
  };
  const [noteDragOverlayMode, setDraggedNote] = useBuilderStateContext(
    (state) => [state.noteDragOverlayMode, state.setDraggedNote],
  );
  const [setPanningMode, panningMode, showMinimap, setShowMinimap, readonly] =
    useBuilderStateContext((state) => {
      return [
        state.setPanningMode,
        state.panningMode,
        state.showMinimap,
        state.setShowMinimap,
        state.readonly,
      ];
    });
  const spacePressed = useKeyPress('Space');
  const shiftPressed = useKeyPress('Shift');
  const isInGrabMode =
    (spacePressed() || panningMode === 'grab') && !shiftPressed();
  return (
    <div
      id="canvas-controls"
      class="z-50 absolute bottom-2 left-0 flex items-center  w-full pointer-events-none "
    >
      <div class=" absolute flex ml-2 items-center justify-center p-1.5 pointer-events-auto rounded-lg bg-background border border-sidebar-border">
        <CanvasButtonWrapper
          tooltip={t('Minimap' + (isMac() ? ' (⌘ + M)' : ' (Ctrl + M)'))}
        >
          <Button
            variant={showMinimap ? 'default' : 'ghost'}
            size="icon"
            onClick={() => {
              setShowMinimap(!showMinimap);
            }}
          >
            <Map class="size-4" />
          </Button>
        </CanvasButtonWrapper>
      </div>
      <div class="grow" />

      <div class="bg-background gap-2 flex items-center shadow-2xl justify-center border border-sidebar-border p-1.5 rounded-lg pointer-events-auto">
        <CanvasButtonWrapper tooltip={t('Zoom in')}>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <Plus class="size-4" />
          </Button>
        </CanvasButtonWrapper>
        <CanvasButtonWrapper tooltip={t('Zoom out')}>
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <Minus class="size-4" />
          </Button>
        </CanvasButtonWrapper>
        <CanvasButtonWrapper tooltip={t('Fit to view')}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleFitToView(false)}
          >
            <Fullscreen class="size-4" />
          </Button>
        </CanvasButtonWrapper>
        <div>
          <Separator orientation="vertical" class="h-5" />
        </div>
        <CanvasButtonWrapper tooltip={t('Grab mode')}>
          <Button
            variant={isInGrabMode ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setPanningMode('grab')}
          >
            <Hand class="size-4" />
          </Button>
        </CanvasButtonWrapper>
        <CanvasButtonWrapper tooltip={t('Select mode')}>
          <Button
            variant={!isInGrabMode ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setPanningMode('pan')}
          >
            <MousePointer class="size-4" />
          </Button>
        </CanvasButtonWrapper>
        <Show when={!readonly}>
          <CanvasButtonWrapper tooltip={t('Add note')}>
            <Button
              variant={
                noteDragOverlayMode === NoteDragOverlayMode.CREATE
                  ? 'default'
                  : 'ghost'
              }
              size="icon"
              onClick={() => {
                setDraggedNote(
                  {
                    id: '',
                    content: '',
                    createdAt: '',
                    updatedAt: '',
                    position: { x: 0, y: 0 },
                    size: {
                      width: flowCanvasConsts.NOTE_CREATION_OVERLAY_WIDTH,
                      height: flowCanvasConsts.NOTE_CREATION_OVERLAY_HEIGHT,
                    },
                    color: flowCanvasConsts.DEFAULT_NOTE_COLOR,
                  },
                  NoteDragOverlayMode.CREATE,
                );
              }}
            >
              <StickyNote class="size-4" />
            </Button>
          </CanvasButtonWrapper>
        </Show>
      </div>
      <div class="grow" />
    </div>
  );
};

export { CanvasControls };

const CanvasButtonWrapper = (props: CanvasButtonWrapperProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{props.children}</TooltipTrigger>
      <TooltipContent>{props.tooltip}</TooltipContent>
    </Tooltip>
  );
};

const isApNode = (node: Node): node is ApNode => {
  return Object.values(ApNodeType).some((type) => type === node.type);
};

type CanvasButtonWrapperProps = { children: JSX.Element; tooltip: string };
