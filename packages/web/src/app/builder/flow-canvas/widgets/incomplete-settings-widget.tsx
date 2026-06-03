import { FlowVersion, Step, flowStructureUtil } from '@activepieces/shared';
import { t } from 'i18next';
import { createMemo, Show } from 'solid-js';

import { BuilderState } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';

import { useReactFlow } from '../solid-flow-adapter';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';

type IncompleteSettingsButtonProps = {
  flowVersion: FlowVersion;
  selectStepByName: BuilderState['selectStepByName'];
};

const IncompleteSettingsButton = (props: IncompleteSettingsButtonProps) => {
  const invalidSteps = createMemo(
    () =>
      flowStructureUtil
        .getAllSteps(props.flowVersion.trigger)
        .filter(filterValidOrSkippedSteps).length,
  );
  const { fitView } = useReactFlow();
  function onClick() {
    const invalidSteps = flowStructureUtil
      .getAllSteps(props.flowVersion.trigger)
      .filter(filterValidOrSkippedSteps);
    if (invalidSteps.length > 0) {
      props.selectStepByName(invalidSteps[0].name);
      void fitView(
        flowCanvasUtils.createFocusStepInGraphParams(invalidSteps[0].name),
      );
    }
  }
  return (
    <Show when={!props.flowVersion.valid}>
      <Button
        variant="ghost"
        class="h-[28px] hover:bg-amber-50 p-2 dark:hover:bg-amber-950 dark:bg-amber-950 bg-amber-50 border border-solid border-amber-500 hover:border-amber-700 dark:hover:border-amber-600  dark:border-amber-900 dark:text-amber-600 text-amber-700 hover:text-amber-700 dark:hover:text-amber-600   animate-fade"
        key={'complete-flow-button'}
        onClick={(e) => {
          onClick();
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {t('incompleteSteps', { invalidSteps: invalidSteps() })}
      </Button>
    </Show>
  );
};

export default IncompleteSettingsButton;
function filterValidOrSkippedSteps(step: Step) {
  if ('skip' in step && step.skip) return false;
  return !step.valid;
}
