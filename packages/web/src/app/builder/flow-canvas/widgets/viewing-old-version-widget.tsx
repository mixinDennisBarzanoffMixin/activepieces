import { isNil, Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { Info } from 'lucide-solid';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { EditFlowOrViewDraftButton } from '../../builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '../../builder-hooks';
import { OverwriteDraftDialog } from '../../flow-versions/overwrite-draft-dialog';

import LargeWidgetWrapper from './large-widget-wrapper';

const ViewingOldVersionWidget = () => {
  const [run, readonly, version, isPublishing] = useBuilderStateContext(
    (state) => [
      state.run,
      state.readonly,
      state.flowVersion,
      state.isPublishing,
    ],
  );
  const versionNumber = flowHooks
    .useGetFlowVersionNumber({ flowId: version.flowId, versionId: version.id })
    .toString();
  const { checkAccess } = useAuthorization();
  const hasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  if (!isNil(run) || !readonly || isPublishing) {
    return null;
  }
  return (
    <LargeWidgetWrapper>
      <>
        <div class="flex items-center gap-2">
          <Info class="size-5" />
          <span>
            {t('Viewing version')} #{versionNumber}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <Show when={hasPermissionToWriteFlow}>
            <OverwriteDraftDialog
              versionId={version.id}
              versionNumber={versionNumber}
              onConfirm={undefined}
            >
              <Button variant="ghost" size="sm">
                {t('Use as Draft')}
              </Button>
            </OverwriteDraftDialog>
          </Show>
          <EditFlowOrViewDraftButton onCanvas={false} />
        </div>
      </>
    </LargeWidgetWrapper>
  );
};
export { ViewingOldVersionWidget };
