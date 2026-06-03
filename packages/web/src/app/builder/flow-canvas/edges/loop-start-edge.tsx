import { StepLocationRelativeToParent } from '@activepieces/shared';
import { createMemo, Show } from 'solid-js';

import { BaseEdge } from '../solid-flow-adapter';
import type { EdgeProps } from '../solid-flow-adapter';
import { flowCanvasConsts } from '../utils/consts';
import { ApLoopStartEdge } from '../utils/types';

import { ApAddButton } from './add-button';

export const ApLoopStartLineCanvasEdge = (
  props: EdgeProps & ApLoopStartEdge,
) => {
  const startY = createMemo(
    () => props.sourceY + flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE,
  );
  const verticalLineLength =
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;

  const horizontalLineLength = createMemo(
    () =>
      Math.abs(props.targetX - props.sourceX) - 2 * flowCanvasConsts.ARC_LENGTH,
  );
  const path = createMemo(
    () => `M ${props.sourceX} ${startY()} v${verticalLineLength / 2}
  ${flowCanvasConsts.ARC_RIGHT_DOWN} h${horizontalLineLength()}
  ${flowCanvasConsts.ARC_RIGHT} v${verticalLineLength}
   ${!props.data.isLoopEmpty ? flowCanvasConsts.ARROW_DOWN : ''}`,
  );

  const showDebugForLineEndPoint = false;
  const buttonPosition = createMemo(() => ({
    x:
      props.sourceX -
      flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2 +
      horizontalLineLength() +
      flowCanvasConsts.ARC_LENGTH * 2,
    y: startY() + verticalLineLength + flowCanvasConsts.ARC_LENGTH,
  }));

  return (
    <>
      <BaseEdge
        path={path()}
        style={{ 'stroke-width': `${flowCanvasConsts.LINE_WIDTH}px` }}
        class="relative"
      />
      <Show when={!props.data.isLoopEmpty}>
        <foreignObject
          x={buttonPosition().x}
          y={buttonPosition().y}
          width={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height}
          class="overflow-visible cursor-default"
        >
          <ApAddButton
            edgeId={props.id}
            stepLocationRelativeToParent={
              StepLocationRelativeToParent.INSIDE_LOOP
            }
            parentStepName={props.source}
          />
        </foreignObject>
      </Show>

      <Show when={showDebugForLineEndPoint}>
        <foreignObject
          x={props.sourceX}
          y={startY()}
          class="w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center absolute"
        >
          <div class=" w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center" />
        </foreignObject>
      </Show>
    </>
  );
};
