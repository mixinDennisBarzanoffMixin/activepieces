import { Show } from 'solid-js';

import { Handle, Position } from '../solid-flow-adapter';
import { flowCanvasConsts } from '../utils/consts';
import { ApGraphEndNode } from '../utils/types';
import FlowEndWidget from '../widgets/flow-end-widget';

const ApGraphEndWidgetNode = (props: Omit<ApGraphEndNode, 'position'>) => {
  return (
    <>
      <div class="h-px w-px relative ">
        <Show when={props.data.showWidget}>
          <FlowEndWidget />
        </Show>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
    </>
  );
};

export default ApGraphEndWidgetNode;
