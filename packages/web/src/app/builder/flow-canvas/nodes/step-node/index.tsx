import {
  FlowOperationType,
  Step,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';
import { Show, createMemo, untrack } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import { LoopIterationInput } from '@/app/builder/run-details/loop-iteration-input';
import { RightSideBarType } from '@/app/builder/types';
import { stepsHooks } from '@/features/pieces';
import { useDraggable } from '@/lib/solid-dnd-kit';
import { cn } from '@/lib/utils';

import { Handle, NodeProps, Position } from '../../solid-flow-adapter';
import { flowCanvasConsts } from '../../utils/consts';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';
import { ApStepNode } from '../../utils/types';

import { StepNodeChevron } from './step-node-chevron';
import { StepNodeDisplayName } from './step-node-display-name';
import { StepNodeLogo } from './step-node-logo';
import { StepNodeName } from './step-node-name';
import { ApStepNodeSkippedStatus } from './step-node-skipped-status';
import { ApStepNodeStatusInDraft } from './step-node-status-in-draft';
import { ApStepNodeStatusInRun } from './step-node-status-in-run';
import { TriggerWidget } from './trigger-widget';

const ApStepCanvasNode = (props: NodeProps & Omit<ApStepNode, 'position'>) => {
  const step = createMemo(() => props.data.step);
  const name = createMemo(() => step().name);
  const [
    selectStepByName,
    isSelected,
    isDragging,
    readonly,
    flowVersion,
    setSelectedBranchIndex,
    isPieceSelectorOpened,
    setOpenedPieceSelectorStepNameOrAddButtonId,
    isRightSidebarOpen,
  ] = useBuilderStateContext((state) => [
    state.selectStepByName,
    state.selectedStep === name(),
    state.activeDraggingStep === name(),
    state.readonly,
    state.flowVersion,
    state.setSelectedBranchIndex,
    state.openedPieceSelectorStepNameOrAddButtonId === name(),
    state.setOpenedPieceSelectorStepNameOrAddButtonId,
    state.rightSidebar !== RightSideBarType.NONE,
  ]);
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step: untrack(step),
  });
  const stepIndex = createMemo(() =>
    flowStructureUtil.getStepNumber(flowVersion.trigger, name()),
  );
  const trigger = createMemo(() => flowStructureUtil.isTrigger(step().type));
  const skipped = createMemo(() =>
    flowCanvasUtils.isSkipped(name(), flowVersion.trigger),
  );
  const display = createMemo(() => String(stepMetadata?.displayName ?? ''));
  const logo = createMemo(() => String(stepMetadata?.logoUrl ?? ''));

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: untrack(name),
    disabled: untrack(trigger) || readonly,
    data: {
      type: flowCanvasConsts.DRAGGED_STEP_TAG,
    },
  });

  const handleStepClick = (e: MouseEvent, preventDefault = true) => {
    selectStepByName(name());
    setSelectedBranchIndex(null);
    if (step().type === FlowTriggerType.EMPTY) {
      setOpenedPieceSelectorStepNameOrAddButtonId(name());
    }
    if (preventDefault) {
      e.stopPropagation();
      e.preventDefault();
    }
  };
  const handleContextMenu = (e: MouseEvent) => {
    handleStepClick(e, false);
    if (isRightSidebarOpen) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const rect = target.getBoundingClientRect();

    // we need to delay the context menu to ensure the right sidebar is opened first
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    setTimeout(() => {
      const currentRect = target.getBoundingClientRect();
      const screenX = currentRect.left + relativeX;
      const screenY = currentRect.top + relativeY;
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: screenX,
        clientY: screenY,
        button: 2,
        buttons: 2,
      });
      target.dispatchEvent(contextMenuEvent);
    }, flowCanvasConsts.SIDEBAR_ANIMATION_DURATION + 50);
  };

  return (
    <div
      data-step-context-menu={name()}
      style={{
        height: `${flowCanvasConsts.AP_NODE_SIZE.STEP.height}px`,
        width: `${flowCanvasConsts.AP_NODE_SIZE.STEP.width}px`,
        'max-width': `${flowCanvasConsts.AP_NODE_SIZE.STEP.width}px`,
      }}
      onContextMenu={(e) => handleContextMenu(e)}
      class={cn(
        'transition-all border-box rounded-md border border-solid border-border relative overflow-visible  group',
        {
          'border-primary': isSelected,
          'bg-background': !isDragging,
          'border-none': isDragging,
          'shadow-none': isDragging,
          'bg-accent': skipped(),
          'rounded-tl-none': trigger(),
          'hover:border-ring': !isSelected,
        },
      )}
      onClick={(e) => handleStepClick(e)}
      ref={isPieceSelectorOpened ? null : setNodeRef}
      role={isPieceSelectorOpened ? undefined : attributes.role}
      {...listeners}
    >
      <Show when={trigger()}>
        <TriggerWidget isSelected={isSelected} />
      </Show>
      <LoopIterationInput stepName={name()} />
      <ApStepNodeStatusInRun stepName={name()} />
      <ApStepNodeSkippedStatus stepName={name()} />
      <ApStepNodeStatusInDraft stepName={name()} />
      <StepNodeName stepName={name()} />
      <div class="px-3 h-full w-full overflow-hidden">
        <Show when={!isDragging}>
          <PieceSelector
            operation={{
              type: getPieceSelectorOperationType(step()),
              stepName: name(),
            }}
            id={name()}
            openSelectorOnClick={false}
            stepToReplacePieceDisplayName={display()}
          >
            <div
              class="flex items-center justify-center h-full w-full gap-[10px]"
              onClick={(e) => {
                if (!isPieceSelectorOpened) {
                  handleStepClick(e);
                }
              }}
            >
              <StepNodeLogo
                isSkipped={skipped()}
                logoUrl={logo()}
                displayName={display()}
              />
              <StepNodeDisplayName
                stepDisplayName={step().displayName}
                stepIndex={stepIndex()}
                isSkipped={skipped()}
                pieceDisplayName={display()}
                stepName={name()}
              />
              <Show when={!readonly}>
                <StepNodeChevron />
              </Show>
            </div>
          </PieceSelector>
        </Show>

        <Handle
          type="source"
          style={flowCanvasConsts.HANDLE_STYLING}
          position={Position.Bottom}
        />
        <Handle
          type="target"
          style={flowCanvasConsts.HANDLE_STYLING}
          position={Position.Top}
        />
      </div>
    </div>
  );
};

export { ApStepCanvasNode };

function getPieceSelectorOperationType(step: Step) {
  if (flowStructureUtil.isTrigger(step.type)) {
    return FlowOperationType.UPDATE_TRIGGER;
  }
  return FlowOperationType.UPDATE_ACTION;
}
