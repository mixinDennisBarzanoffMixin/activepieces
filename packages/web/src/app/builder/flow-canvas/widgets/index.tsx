import { Show } from 'solid-js';

import FlowEndWidget from '@/app/builder/flow-canvas/widgets/flow-end-widget';
import IncompleteSettingsButton from '@/app/builder/flow-canvas/widgets/incomplete-settings-widget';
import { TestFlowWidget } from '@/app/builder/flow-canvas/widgets/test-flow-widget';

import { useBuilderStateContext } from '../../builder-hooks';
import { ViewportPortal } from '../solid-flow-adapter';
import { flowCanvasConsts } from '../utils/consts';

const AboveFlowWidgets = () => {
  const [flowVersion, selectStepByName, readonly] = useBuilderStateContext(
    (state) => [state.flowVersion, state.selectStepByName, state.readonly],
  );
  return (
    <ViewportPortal>
      <WidgetWrapper>
        <div
          style={{
            transform: `translate(0px,-${flowCanvasConsts.AP_NODE_SIZE.STEP.height}px )`,
            position: 'absolute',
            'pointer-events': 'auto',
          }}
        >
          <div class="justify-center items-center flex w-[260px]">
            <TestFlowWidget />
            <Show when={!readonly}>
              <IncompleteSettingsButton
                flowVersion={flowVersion}
                selectStepByName={selectStepByName}
              />
            </Show>
          </div>
        </div>
      </WidgetWrapper>
    </ViewportPortal>
  );
};

const BelowFlowWidget = () => {
  return (
    <ViewportPortal>
      <WidgetWrapper>
        <div
          style={{
            'pointer-events': 'auto',
          }}
        >
          <div
            class="flex items-center justify-center gap-2"
            style={{ width: flowCanvasConsts.AP_NODE_SIZE.STEP.width + 'px' }}
          >
            <FlowEndWidget />
          </div>
        </div>
      </WidgetWrapper>
    </ViewportPortal>
  );
};

const WidgetWrapper = (props: { children: any }) => {
  return (
    <div
      style={{ width: flowCanvasConsts.AP_NODE_SIZE.STEP.width + 'px' }}
      class="flex items-center justify-center"
    >
      {props.children}
    </div>
  );
};

export { AboveFlowWidgets, BelowFlowWidget };
