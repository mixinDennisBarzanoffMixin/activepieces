import { FlowVersionState, isNil } from '@activepieces/shared';
import { Show } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { FlowStatusToggle, FlowVersionStateDot } from '@/features/flows';

const BuilderFlowStatusSection = () => {
  const [flowVersion, flow] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.flow,
  ]);

  return (
    <div className="flex items-center space-x-2">
      <FlowVersionStateDot
        state={flowVersion.state}
        versionId={flowVersion.id}
        publishedVersionId={flow.publishedVersionId}
      ></FlowVersionStateDot>
      <Show
        when={(
          flow.publishedVersionId === flowVersion.id ||
          (flowVersion.state === FlowVersionState.DRAFT &&
            !isNil(flow.publishedVersionId))
        )()}
      >
        <FlowStatusToggle flow={flow}></FlowStatusToggle>
      </Show>
    </div>
  );
};

BuilderFlowStatusSection.displayName = 'BuilderFlowStatusSection';
export { BuilderFlowStatusSection };
