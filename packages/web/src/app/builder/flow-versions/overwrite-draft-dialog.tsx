import { Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { createSignal } from 'solid-js';

import { RightSideBarType } from '@/app/builder/types';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { flowHooks } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { useBuilderStateContext } from '../builder-hooks';

const OverwriteDraftDialog = (props: OverwriteDraftDialogProps) => {
  const { checkAccess } = useAuthorization();
  const [setVersion, setRightSidebar, flow] = useBuilderStateContext(
    (state) => [state.setVersion, state.setRightSidebar, state.flow],
  );
  const { mutate: overWriteDraftWithVersion, isPending: isOverwritingDraft } =
    flowHooks.useOverWriteDraftWithVersion({
      onSuccess: (updatedFlow) => {
        setVersion(updatedFlow.version);
        setRightSidebar(RightSideBarType.NONE);
      },
    });
  const userHasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const [open, setOpen] = createSignal(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger disabled={!userHasPermissionToWriteFlow} class="w-full">
        <PermissionNeededTooltip hasPermission={userHasPermissionToWriteFlow}>
          {props.children}
        </PermissionNeededTooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Overwrite Draft')}</DialogTitle>
          <DialogDescription>
            {t('Your current draft will be replaced with')}{' '}
            <span class="font-semibold">
              {t('version #{versionNumber}', {
                versionNumber: props.versionNumber,
              })}
            </span>
            {'. '}
            {t('This cannot be undone.')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="justify-end">
          <DialogClose asChild>
            <Button variant={'outline'}>{t('Cancel')}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              loading={isOverwritingDraft}
              onClick={() => {
                overWriteDraftWithVersion({
                  flowId: flow.id,
                  versionId: props.versionId,
                });
                props.onConfirm?.();
              }}
            >
              {t('Overwrite')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
type OverwriteDraftDialogProps = {
  onConfirm: (() => void) | undefined;
  children: any;
  versionId: string;
  versionNumber: string;
};
export { OverwriteDraftDialog };
