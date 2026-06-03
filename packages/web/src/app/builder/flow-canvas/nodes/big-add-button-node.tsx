import { isNil } from '@activepieces/shared';
import { Plus } from 'lucide-solid';
import { Show, createSignal, createUniqueId } from 'solid-js';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { Button } from '@/components/ui/button';
import {
  DragMoveEvent,
  useDndMonitor,
  useDroppable,
} from '@/lib/solid-dnd-kit';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';
import { Handle, Position } from '../solid-flow-adapter';
import { flowCanvasConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { ApBigAddButtonNode } from '../utils/types';

const ApBigAddButtonCanvasNode = (
  props: Omit<ApBigAddButtonNode, 'position'>,
) => {
  const [isIsStepInsideDropzone, setIsStepInsideDropzone] = createSignal(false);
  const [readonly, activeDraggingStep, isPieceSelectorOpened] =
    useBuilderStateContext((state) => [
      state.readonly,
      state.activeDraggingStep,
      state.openedPieceSelectorStepNameOrAddButtonId === props.id,
    ]);
  const draggableId = createUniqueId();
  const { setNodeRef } = useDroppable({
    id: draggableId,
    data: {
      accepts: flowCanvasConsts.DRAGGED_STEP_TAG,
      ...props.data,
    },
  });
  const isShowingDropIndicator = !isNil(activeDraggingStep);
  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      setIsStepInsideDropzone(event.over?.id === draggableId);
    },
    onDragEnd() {
      setIsStepInsideDropzone(false);
    },
  });
  return (
    <>
      {
        <div
          style={{
            height: `${flowCanvasConsts.AP_NODE_SIZE.STEP.height}px`,
            width: `${flowCanvasConsts.AP_NODE_SIZE.STEP.width}px`,
          }}
          class="flex justify-center items-center "
        >
          <Show when={!readonly}>
            <div class="bg-builder-background">
              <div
                style={{
                  height: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.height}px`,
                  width: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width}px`,
                }}
                class=" cursor-auto border-none flex items-center justify-center relative "
              >
                <div
                  style={{
                    height: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.height}px`,
                    width: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width}px`,
                  }}
                  id={props.id}
                  class={cn('rounded-lg bg-background relative', {
                    'bg-primary/80':
                      isShowingDropIndicator || isPieceSelectorOpened,
                    'shadow-add-button':
                      isIsStepInsideDropzone || isPieceSelectorOpened,
                    'transition-all':
                      isIsStepInsideDropzone ||
                      isPieceSelectorOpened ||
                      isShowingDropIndicator,
                  })}
                >
                  <Show when={!isShowingDropIndicator}>
                    <PieceSelector
                      operation={flowCanvasUtils.createAddOperationFromAddButtonData(
                        props.data,
                      )}
                      id={props.id}
                    >
                      <span>
                        <Button
                          variant="transparent"
                          class="w-full h-full flex items-center hover:bg-accent-foreground rounded-lg border-border border-solid border"
                        >
                          <Plus
                            class={cn('w-6 h-6 text-foreground ', {
                              'opacity-0':
                                isShowingDropIndicator || isPieceSelectorOpened,
                            })}
                          />
                        </Button>
                      </span>
                    </PieceSelector>
                  </Show>
                </div>
                <Show when={isShowingDropIndicator}>
                  <div
                    style={{
                      height: `${flowCanvasConsts.AP_NODE_SIZE.STEP.height}px`,
                      width: `${flowCanvasConsts.AP_NODE_SIZE.STEP.width}px`,
                      top: `-${
                        flowCanvasConsts.AP_NODE_SIZE.STEP.height / 2 -
                        flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width / 2
                      }px`,
                    }}
                    class=" absolute "
                    ref={setNodeRef}
                  >
                    {' '}
                  </div>
                </Show>
              </div>
            </div>
          </Show>
          <Show when={readonly}>
            <div
              style={{
                height: `${flowCanvasConsts.AP_NODE_SIZE.STEP.height}px`,
                width: `${flowCanvasConsts.AP_NODE_SIZE.STEP.width}px`,
              }}
              class=" cursor-auto  flex items-center justify-center relative "
            >
              <svg
                height={flowCanvasConsts.AP_NODE_SIZE.STEP.height}
                width={flowCanvasConsts.AP_NODE_SIZE.STEP.width}
                class="overflow-visible border-transparent "
                style={{
                  stroke: 'var(--xy-edge-stroke, var(--xy-edge-stroke))',
                }}
                shapeRendering="auto"
              >
                <g>
                  <path
                    d={`M ${
                      flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2
                    } -10 v ${flowCanvasConsts.AP_NODE_SIZE.STEP.height + 14}`}
                    fill="transparent"
                    strokeWidth="1.5"
                  />
                </g>
              </svg>
            </div>
          </Show>
        </div>
      }

      <Handle
        type="source"
        position={Position.Bottom}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
    </>
  );
};

export { ApBigAddButtonCanvasNode };
