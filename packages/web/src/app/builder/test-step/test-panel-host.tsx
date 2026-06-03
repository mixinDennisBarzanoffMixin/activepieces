import { FlowActionType, FlowTriggerType } from '@activepieces/shared';
import { Show, createEffect } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { cn } from '@/lib/utils';

import { FlowStepInputOutput } from '../run-details/flow-step-input-output';

import { TestStepContainer } from '.';

const DISMISS_IGNORE_SELECTOR = [
  '[data-test-panel-trigger]',
  '[data-radix-popper-content-wrapper]',
  '[role="dialog"]',
  '[data-slot="resizable-handle"]',
  '[data-panel-resize-handle-id]',
].join(',');

type TestPanelHostProps = {
  mode: 'drawer' | 'split';
  flowId: string;
  flowVersionId: string;
  projectId?: string;
  stepType: FlowActionType | FlowTriggerType;
  showGenerateSampleData: boolean;
  showStepInputOutFromRun: boolean;
  saving: boolean;
};

const TestPanelHost = (props: TestPanelHostProps) => {
  const [setTestPanelOpen, isTestPanelOpen] = useBuilderStateContext(
    (state) => [state.setTestPanelOpen, state.isTestPanelOpen],
  );
  let drawerRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (props.mode !== 'drawer' || !isTestPanelOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (drawerRef?.contains(target)) return;
      if (target.closest(DISMISS_IGNORE_SELECTOR)) return;
      setTestPanelOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  });

  return (
    <div
      ref={(el) => (drawerRef = el)}
      class={cn(
        'h-full w-full bg-background flex flex-col overflow-hidden border border-border',
        props.mode === 'drawer' &&
          'rounded-t-xl shadow-lg border-b-0 border-x-0',
        props.mode === 'split' && 'rounded-t-xl border-b-0',
      )}
      role={props.mode === 'drawer' ? 'dialog' : undefined}
    >
      <Show when={props.showGenerateSampleData && props.projectId}>
        <TestStepContainer
          type={props.stepType}
          flowId={props.flowId}
          flowVersionId={props.flowVersionId}
          projectId={props.projectId}
          isSaving={props.saving}
        />
      </Show>
      <Show when={props.showStepInputOutFromRun}>
        <FlowStepInputOutput />
      </Show>
    </div>
  );
};

export { TestPanelHost };
