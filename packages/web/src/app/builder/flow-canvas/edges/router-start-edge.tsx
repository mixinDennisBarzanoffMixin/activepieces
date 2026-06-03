import { Show } from 'solid-js';

import { BaseEdge } from '../solid-flow-adapter';
import type { EdgeProps } from '../solid-flow-adapter';
import { flowCanvasConsts } from '../utils/consts';
import { ApRouterStartEdge } from '../utils/types';

import { ApAddButton } from './add-button';
import { BranchLabel } from './branch-label';

export const ApRouterStartCanvasEdge = (
  props: EdgeProps & Omit<ApRouterStartEdge, 'position'>,
) => {
  const verticalLineLength =
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
    flowCanvasConsts.LABEL_HEIGHT;

  const generatePath = () => {
    const distance = Math.abs(props.targetX - props.sourceX);

    // Start point and initial vertical line
    let path = `M ${props.targetX} ${
      props.targetY - flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
    }`;

    // Add arrow if branch is not empty
    if (!props.data.isBranchEmpty) {
      path += flowCanvasConsts.ARROW_DOWN;
    }

    // Vertical line up
    path += `v -${verticalLineLength}`;

    // Arc or vertical line based on distance
    if (distance >= flowCanvasConsts.ARC_LENGTH) {
      // Add appropriate arc based on source position
      path +=
        props.sourceX > props.targetX
          ? ' a12,12 0 0,1 12,-12'
          : ' a-12,-12 0 0,0 -12,-12';

      if (props.data.drawHorizontalLine) {
        // Calculate horizontal line length
        const horizontalLength =
          (Math.abs(props.targetX - props.sourceX) +
            3 -
            2 * flowCanvasConsts.ARC_LENGTH) *
          (props.sourceX > props.targetX ? 1 : -1);

        // Add horizontal line and arc
        path += `h ${horizontalLength}`;
        path +=
          props.sourceX > props.targetX
            ? flowCanvasConsts.ARC_LEFT_UP
            : flowCanvasConsts.ARC_RIGHT_UP;
      }

      if (props.data.drawStartingVerticalLine) {
        // Add final vertical line
        const finalVerticalLength =
          flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS / 2 -
          2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;
        path += `v -${finalVerticalLength}`;
      }
    } else {
      // If distance is small, just draw vertical line
      path += `v -${
        flowCanvasConsts.ARC_LENGTH +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
      }`;
    }

    return path;
  };

  return (
    <>
      <BaseEdge
        path={generatePath()}
        style={{ 'stroke-width': `${flowCanvasConsts.LINE_WIDTH}px` }}
      />
      <Show when={!props.data.isBranchEmpty}>
        <foreignObject
          x={props.targetX - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2}
          y={props.targetY - verticalLineLength / 2}
          width={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height}
          class="overflow-visible"
        >
          <ApAddButton
            edgeId={props.id}
            stepLocationRelativeToParent={
              props.data.stepLocationRelativeToParent
            }
            parentStepName={props.source}
            branchIndex={props.data.branchIndex}
          />
        </foreignObject>
      </Show>

      <foreignObject
        width={flowCanvasConsts.AP_NODE_SIZE.STEP.width - 10 + 'px'}
        height={
          flowCanvasConsts.LABEL_HEIGHT +
          flowCanvasConsts.LABEL_VERTICAL_PADDING +
          'px'
        }
        x={props.targetX - (flowCanvasConsts.AP_NODE_SIZE.STEP.width - 10) / 2}
        y={
          props.targetY -
          verticalLineLength / 2 -
          flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height -
          30
        }
        class="flex items-center "
      >
        <BranchLabel
          key={props.data.label + props.target}
          sourceNodeName={props.source}
          targetNodeName={props.target}
          stepLocationRelativeToParent={props.data.stepLocationRelativeToParent}
          branchIndex={props.data.branchIndex}
          label={props.data.label}
        />
      </foreignObject>
    </>
  );
};
