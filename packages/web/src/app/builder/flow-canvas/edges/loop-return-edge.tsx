import { StepLocationRelativeToParent } from '@activepieces/shared';
import { createMemo, Show } from 'solid-js';

import { BaseEdge } from '../solid-flow-adapter';
import type { EdgeProps } from '../solid-flow-adapter';
import { flowCanvasConsts } from '../utils/consts';
import { ApLoopReturnEdge } from '../utils/types';

import { ApAddButton } from './add-button';

export const ApLoopReturnLineCanvasEdge = (
  props: EdgeProps & ApLoopReturnEdge,
) => {
  const horizontalLineLength = createMemo(
    () =>
      Math.abs(props.sourceX - props.targetX) - 2 * flowCanvasConsts.ARC_LENGTH,
  );

  const verticalLineLength = createMemo(
    () => props.data.verticalSpaceBetweenReturnNodeStartAndEnd,
  );
  const ARROW_RIGHT = ` m-5 -6 l6 6  m-6 0 m6 0 l-6 6 m3 -6`;
  const endLineLength =
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
    8;
  const path = createMemo(
    () => `
  M ${props.sourceX - 0.5} ${
      props.sourceY - flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
    }
  v 1
  ${flowCanvasConsts.ARC_LEFT_DOWN} h -${horizontalLineLength()}
  ${flowCanvasConsts.ARC_RIGHT_UP} v -${verticalLineLength()}
  a15,15 0 0,1 15,-15

  h ${horizontalLineLength() / 2 - 2 * flowCanvasConsts.ARC_LENGTH}
   ${ARROW_RIGHT}

  M ${
    props.sourceX - flowCanvasConsts.ARC_LENGTH - horizontalLineLength() / 2
  } ${
      props.sourceY +
      flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
      flowCanvasConsts.ARC_LENGTH / 2
    }
   v${endLineLength} ${
      props.data.drawArrowHeadAfterEnd ? flowCanvasConsts.ARROW_DOWN : ''
    }
   `,
  );
  const buttonPosition = createMemo(() => ({
    x:
      props.sourceX -
      horizontalLineLength() / 2 -
      flowCanvasConsts.ARC_LENGTH -
      flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2,
    y: props.sourceY + endLineLength / 2,
  }));
  const showDebugForLineEndPoint = false;
  return (
    <>
      <BaseEdge
        path={path()}
        style={{ 'stroke-width': `${flowCanvasConsts.LINE_WIDTH}px` }}
        class="relative"
      />
      <Show when={showDebugForLineEndPoint}>
        <foreignObject
          x={props.targetX}
          y={props.targetY}
          class="w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center absolute"
        >
          <div class=" w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center" />
        </foreignObject>
      </Show>

      {
        <foreignObject
          x={buttonPosition().x}
          y={buttonPosition().y}
          width={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height}
          class="overflow-visible"
        >
          <ApAddButton
            edgeId={props.id}
            stepLocationRelativeToParent={StepLocationRelativeToParent.AFTER}
            parentStepName={props.data.parentStepName}
          />
        </foreignObject>
      }

      <Show when={showDebugForLineEndPoint}>
        <foreignObject
          x={props.sourceX}
          y={props.sourceY}
          class="w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center absolute"
        >
          <div class=" w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center" />
        </foreignObject>
      </Show>
    </>
  );
};
