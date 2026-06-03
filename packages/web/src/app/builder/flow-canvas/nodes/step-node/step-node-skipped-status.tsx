import {
  FlowTriggerType,
  FlowVersionState,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { RouteOff } from 'lucide-solid';

import { flowRunUtils } from '@/features/flow-runs';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';

const ApStepNodeSkippedStatus = (props: { stepName: string }) => {
  const [run, stepType, isInDraft, isSkipped] = useBuilderStateContext(
    (state) => [
      state.run,
      flowStructureUtil.getStep(props.stepName, state.flowVersion.trigger)
        ?.type,
      state.flowVersion.state === FlowVersionState.DRAFT,
      flowCanvasUtils.isSkipped(props.stepName, state.flowVersion.trigger),
    ],
  );

  const hasRun = !isNil(run);
  const shouldShowSkippedStatus =
    isSkipped && (isInDraft || hasRun) && stepType !== FlowTriggerType.EMPTY;

  if (!shouldShowSkippedStatus) {
    return null;
  }

  return (
    <div class="absolute right-[1px] h-[20px] -top-[28px]">
      <div class={flowRunUtils.getStatusContainerClassName('default', true)}>
        <RouteOff class="size-3" />
        <div>{t('Skipped')}</div>
      </div>
    </div>
  );
};

export { ApStepNodeSkippedStatus };
