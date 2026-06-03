import {
  FlowStatus,
  Permission,
  PopulatedFlow,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { createSignal, createEffect, Show } from 'solid-js';

import { LoadingSpinner } from '@/components/custom/spinner';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { Switch } from '../../../components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { flowHooks } from '../hooks/flow-hooks';
import { flowsUtils } from '../utils/flows-utils';

type FlowStatusToggleProps = {
  flow: PopulatedFlow;
};

const FlowStatusToggle = (props: FlowStatusToggleProps) => {
  const [isFlowPublished, setIsFlowPublished] = createSignal(
    props.flow.status === FlowStatus.ENABLED,
  );

  createEffect(() => {
    setIsFlowPublished(props.flow.status === FlowStatus.ENABLED);
  });

  const { checkAccess } = useAuthorization();
  const userHasPermissionToToggleFlowStatus = checkAccess(
    Permission.UPDATE_FLOW_STATUS,
  );

  const { mutate: changeStatus, isPending: isLoading } =
    flowHooks.useChangeFlowStatus({
      flowId: props.flow.id,
      change: isFlowPublished ? FlowStatus.DISABLED : FlowStatus.ENABLED,
      onSuccess: (updatedFlow: PopulatedFlow) => {
        setIsFlowPublished(updatedFlow.status === FlowStatus.ENABLED);
      },
    });

  return (
    <div class="flex items-center justify-start">
      <Tooltip>
        <TooltipTrigger asChild>
          <div class="flex items-center justify-center">
            <Switch
              checked={isFlowPublished}
              onCheckedChange={() => changeStatus()}
              disabled={
                isLoading ||
                !userHasPermissionToToggleFlowStatus ||
                isNil(props.flow.publishedVersionId)
              }
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {userHasPermissionToToggleFlowStatus
            ? isNil(props.flow.publishedVersionId)
              ? t('Please publish flow first')
              : isFlowPublished
              ? t('Flow is on')
              : t('Flow is off')
            : t('Permission Needed')}
        </TooltipContent>
      </Tooltip>
      <Show
        when={isLoading}
        fallback={
          isFlowPublished && (
            <Tooltip>
              <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div class="p-2 rounded-full ">
                  {flowsUtils.flowStatusIconRenderer(props.flow)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {flowsUtils.flowStatusToolTipRenderer(props.flow)}
              </TooltipContent>
            </Tooltip>
          )
        }
      >
        <LoadingSpinner />
      </Show>
    </div>
  );
};

export { FlowStatusToggle };
