import { FlowActionType, FlowTriggerType } from '@activepieces/shared';
import { Show } from 'solid-js';

import { TestActionSection } from './test-action-section';
import { TestTriggerSection } from './test-trigger-section';

type TestStepContainerProps = {
  flowVersionId: string;
  isSaving: boolean;
  flowId: string;
  type: FlowActionType | FlowTriggerType;
  projectId: string;
};

const TestStepContainer = ({
  flowVersionId,
  isSaving,
  type,
  flowId,
  projectId,
}: TestStepContainerProps) => {
  return (
    <div className="flex flex-col h-full">
      <Show
        when={type === FlowTriggerType.PIECE()}
        fallback={
          <TestActionSection
            flowVersionId={flowVersionId}
            isSaving={isSaving}
            projectId={projectId}
          ></TestActionSection>
        }
      >
        <TestTriggerSection
          flowId={flowId}
          isSaving={isSaving}
          flowVersionId={flowVersionId}
          projectId={projectId}
        ></TestTriggerSection>
      </Show>
    </div>
  );
};
TestStepContainer.displayName = 'TestStepContainer';

export { TestStepContainer };
