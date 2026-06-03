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

const TestStepContainer = (props: TestStepContainerProps) => {
  return (
    <div class="flex flex-col h-full">
      <Show
        when={props.type === FlowTriggerType.PIECE}
        fallback={
          <TestActionSection
            flowVersionId={props.flowVersionId}
            isSaving={props.isSaving}
            projectId={props.projectId}
          />
        }
      >
        <TestTriggerSection
          flowId={props.flowId}
          isSaving={props.isSaving}
          flowVersionId={props.flowVersionId}
          projectId={props.projectId}
        />
      </Show>
    </div>
  );
};

export { TestStepContainer };
