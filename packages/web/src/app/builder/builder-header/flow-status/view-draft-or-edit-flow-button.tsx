import { FlowVersionState, Permission } from '@activepieces/shared';
import { useLocation, useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import { EyeIcon, PencilIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasHooks } from '../../flow-canvas/hooks';
import { AboveTriggerButton } from '../../flow-canvas/widgets/above-trigger-button';

const EditFlowOrViewDraftButton = (props: { onCanvas: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  const { switchToDraft, isSwitchingToDraftPending } =
    flowCanvasHooks.useSwitchToDraft();
  const [flowVersion, flowId, readonly, run] = useBuilderStateContext(
    (state) => [state.flowVersion, state.flow.id, state.readonly, state.run],
  );
  const isViewingDraft = flowVersion.state === FlowVersionState.DRAFT;
  const permissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
  if (!readonly || (isViewingDraft && !run)) {
    return null;
  }
  const handleClick = () => {
    if (location.pathname.includes('/runs')) {
      navigate(`/flows/${flowId}`);
    } else {
      switchToDraft();
    }
  };
  const { text, icon } = getButtonTextAndIcon({
    hasPermissionToEditFlow: permissionToEditFlow,
  });

  return (
    <>
      <Show when={props.onCanvas}>
        <AboveTriggerButton
          shortCutIsEscape={true}
          showPrimaryBg={false}
          onClick={handleClick}
          text={text}
        />
      </Show>

      <Show when={!props.onCanvas}>
        <Button
          size={'sm'}
          variant={'basic'}
          loading={isSwitchingToDraftPending}
          class="gap-2"
          onClick={() => {
            if (location.pathname.includes('/runs')) {
              navigate(`/flows/${flowId}`);
            } else {
              switchToDraft();
            }
          }}
        >
          {icon}
          {text}
        </Button>
      </Show>
    </>
  );
};

export { EditFlowOrViewDraftButton };
function getButtonTextAndIcon(props: { hasPermissionToEditFlow: boolean }) {
  const text = props.hasPermissionToEditFlow ? t('Edit flow') : t('View draft');

  if (props.hasPermissionToEditFlow) {
    return {
      icon: <PencilIcon class="size-4" />,
      text,
    };
  }
  return {
    icon: <EyeIcon class="size-4" />,
    text,
  };
}
