import { FlowVersionState } from '@activepieces/shared';
import { t } from 'i18next';
import { Show } from 'solid-js';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type FlowVersionStateProps = {
  state: FlowVersionState;
  publishedVersionId: string | undefined | null;
  versionId: string;
};

const findVersionStateName: (
  state: FlowVersionStateProps,
) => 'Draft' | 'Published' | 'Locked' = ({
  state,
  publishedVersionId,
  versionId,
}) => {
  if (state === FlowVersionState.DRAFT) {
    return 'Draft';
  }
  if (publishedVersionId === versionId) {
    return 'Published';
  }
  return 'Locked';
};
const FlowVersionStateDot = (state: FlowVersionStateProps) => {
  const stateName = findVersionStateName(state);
  if (stateName === 'Locked') {
    return null;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div class="size-8 flex justify-center items-center">
          <Show when={stateName === 'Draft'}>
            <span class="bg-warning size-1.5 rounded-full" />
          </Show>
          <Show when={stateName === 'Published'}>
            <span class="bg-success size-1.5 rounded-full" />
          </Show>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {stateName === 'Draft' && t('Draft')}
        {stateName === 'Published' && t('Published')}
      </TooltipContent>
    </Tooltip>
  );
};

export { FlowVersionStateDot };
