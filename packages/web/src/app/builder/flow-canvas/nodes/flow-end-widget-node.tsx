import { Handle, Position } from '../solid-flow-adapter';
import { Show } from 'solid-js';

import { flowCanvasConsts } from '../utils/consts';
import { ApGraphEndNode } from '../utils/types';
import FlowEndWidget from '../widgets/flow-end-widget';

const ApGraphEndWidgetNode = ({ data }: Omit<ApGraphEndNode, 'position'>) => {
  return (
    <>
      <div className="h-px w-px relative ">
        <Show when={data.showWidget()}>
          <FlowEndWidget></FlowEndWidget>
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

ApGraphEndWidgetNode.displayName = 'ApGraphEndWidgetNode';
export default ApGraphEndWidgetNode;
