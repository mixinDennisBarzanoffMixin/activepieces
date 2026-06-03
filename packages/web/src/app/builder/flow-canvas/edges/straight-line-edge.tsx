import { StepLocationRelativeToParent } from '@activepieces/shared';
import { createMemo, Show } from 'solid-js';

import { BaseEdge } from '../solid-flow-adapter';
import type { EdgeProps } from '../solid-flow-adapter';
import { flowCanvasConsts } from '../utils/consts';
import { ApStraightLineEdge } from '../utils/types';

import { ApAddButton } from './add-button';

export const ApStraightLineCanvasEdge = (
  props: EdgeProps & ApStraightLineEdge,
) => {
  const lineStartX = createMemo(() => props.sourceX);
  const lineStartY = createMemo(() => props.sourceY);
  const lineLength = createMemo(() => props.targetY - props.sourceY);
  const path = createMemo(
    () => `M ${lineStartX()} ${lineStartY()} v${lineLength()}
   ${props.data.drawArrowHead ? flowCanvasConsts.ARROW_DOWN : ''}`,
  );
  const button = createMemo(() => ({
    x: lineStartX() - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2,
    y:
      lineStartY() +
      lineLength() / 2 -
      flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height / 2,
  }));
  const showDebugForLineEndPoint = false;

  return (
    <>
      <BaseEdge
        path={path()}
        style={{ 'stroke-width': `${flowCanvasConsts.LINE_WIDTH}px` }}
      />
      <Show when={!props.data.hideAddButton}>
        <foreignObject
          x={button().x}
          y={button().y}
          width={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height}
          class="overflow-visible cursor-default"
        >
          <ApAddButton
            edgeId={props.id}
            parentStepName={props.source}
            stepLocationRelativeToParent={StepLocationRelativeToParent.AFTER}
          />
        </foreignObject>
      </Show>

      <Show when={showDebugForLineEndPoint}>
        <foreignObject
          x={lineStartX()}
          y={lineStartY() + lineLength()}
          class="w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center absolute"
        >
          <div class=" w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center" />
        </foreignObject>
      </Show>
    </>
  );
};
