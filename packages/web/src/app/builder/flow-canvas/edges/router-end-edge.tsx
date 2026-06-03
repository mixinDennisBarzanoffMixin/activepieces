import { StepLocationRelativeToParent } from '@activepieces/shared';
import { createMemo, Show } from 'solid-js';

import { BaseEdge } from '../solid-flow-adapter';
import type { EdgeProps } from '../solid-flow-adapter';
import { flowCanvasConsts } from '../utils/consts';
import { ApRouterEndEdge } from '../utils/types';

import { ApAddButton } from './add-button';

export const ApRouterEndCanvasEdge = (
  props: EdgeProps & Omit<ApRouterEndEdge, 'position'>,
) => {
  const verticalLineLength =
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;

  const path = createMemo(() => {
    const distance = Math.abs(props.targetX - props.sourceX);
    const horizontal =
      (distance - 2 * flowCanvasConsts.ARC_LENGTH) *
      (props.targetX > props.sourceX ? 1 : -1);

    // Start point
    let path = `M ${props.sourceX - 0.5} ${
      props.sourceY - flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
    }`;

    // Vertical line from start
    path += `v ${props.data.verticalSpaceBetweenLastNodeInBranchAndEndLine}`;

    // Arc or vertical line based on distance
    if (distance >= flowCanvasConsts.ARC_LENGTH) {
      path +=
        props.targetX > props.sourceX
          ? flowCanvasConsts.ARC_RIGHT_DOWN
          : flowCanvasConsts.ARC_LEFT_DOWN;
    } else {
      path += `v ${
        flowCanvasConsts.ARC_LENGTH +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
        2
      }`;
    }

    // Optional horizontal line
    if (props.data.drawHorizontalLine) {
      path += `h ${horizontal} ${
        props.targetX > props.sourceX
          ? flowCanvasConsts.ARC_RIGHT
          : flowCanvasConsts.ARC_LEFT
      }`;
    }

    // Optional ending vertical line with arrow
    if (props.data.drawEndingVerticalLine) {
      path += `v${verticalLineLength}`;
      if (!props.data.isNextStepEmpty) {
        path += flowCanvasConsts.ARROW_DOWN;
      }
    }

    return path;
  });

  return (
    <>
      <BaseEdge
        path={path()}
        style={{ 'stroke-width': `${flowCanvasConsts.LINE_WIDTH}px` }}
      />

      <Show when={props.data.drawEndingVerticalLine}>
        <foreignObject
          x={
            props.targetX -
            flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2 -
            flowCanvasConsts.LINE_WIDTH / 2
          }
          y={props.targetY - verticalLineLength}
          width={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height}
          class="overflow-visible"
        >
          <ApAddButton
            edgeId={props.id}
            stepLocationRelativeToParent={StepLocationRelativeToParent.AFTER}
            parentStepName={props.data.routerOrBranchStepName}
          />
        </foreignObject>
      </Show>
    </>
  );
};
