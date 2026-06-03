import { Show, createMemo } from 'solid-js';

import { StepStatusIcon, flowRunUtils } from '@/features/flow-runs';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';

const ApStepNodeStatusInRun = (props: { stepName: string }) => {
  const [run, loopIndexes] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
  ]);
  const stepStatusInRun = createMemo(() => {
    return flowCanvasUtils.getStepStatus(props.stepName, run, loopIndexes);
  });
  return (
    <Show when={stepStatusInRun()} keyed>
      {(status) => {
        const icon = flowRunUtils.getStatusIconForStep(status);
        return (
          <div class="absolute right-[1px]  h-[20px] -top-[28px]">
            <div
              class={flowRunUtils.getStatusContainerClassName(
                icon.variant,
                true,
              )}
            >
              <StepStatusIcon status={status} size="3" hideTooltip={true} />
              <div>{icon.text}</div>
            </div>
          </div>
        );
      }}
    </Show>
  );
};

export { ApStepNodeStatusInRun };
