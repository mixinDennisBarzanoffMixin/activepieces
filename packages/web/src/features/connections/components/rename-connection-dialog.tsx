import { t } from 'i18next';
import { Pencil } from 'lucide-solid';
import { createSignal } from 'solid-js';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { appConnectionsMutations } from '../hooks/app-connections-hooks';

type RenameConnectionDialogProps = {
  connectionId: string;
  currentName: string;
  userHasPermissionToRename: boolean;
  onRename: () => void;
};

const RenameConnectionDialog = ({
  connectionId,
  currentName,
  userHasPermissionToRename,
  onRename,
}: RenameConnectionDialogProps) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = createSignal(false);
  const [displayName, setDisplayName] = createSignal(currentName);
  const [error, setError] = createSignal('');

  const { mutate: renameConnection, isPending } =
    appConnectionsMutations.useRenameAppConnection({
      currentName,
      setIsRenameDialogOpen,
      renameConnectionForm: {
        setError: (_field: string, err: { message?: string }) =>
          setError(err.message || ''),
      },
      refetch: onRename,
    });

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    setError('');
    renameConnection({
      connectionId,
      displayName: displayName().trim(),
    });
  };

  return (
    <Tooltip>
      <Dialog
        open={isRenameDialogOpen}
        onOpenChange={(open) => setIsRenameDialogOpen(open)}
      >
        <DialogTrigger asChild>
          <>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!userHasPermissionToRename}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsRenameDialogOpen(true);
                }}
              >
                <Pencil class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!userHasPermissionToRename ? t('Permission needed') : t('Edit')}
            </TooltipContent>
          </>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Rename Connection')}</DialogTitle>
            <DialogDescription>
              {t('Enter a new display name for this connection.')}
            </DialogDescription>
          </DialogHeader>
            <form className="grid space-y-4" onSubmit={onSubmit}>
              <div class="grid space-y-2">
                <Label for="displayName">{t('Name')}</Label>
                <Input
                  id="displayName"
                  value={displayName()}
                  placeholder={t('New Connection Name')}
                  class="rounded-sm"
                  onInput={(e) => setDisplayName(e.currentTarget.value)}
                />
              </div>
              {error() && (
                <p class="text-sm font-medium text-destructive">{error()}</p>
              )}
              <DialogFooter class="justify-end">
                <DialogClose asChild>
                  <Button type="button" variant={'outline'}>{t('Cancel')}</Button>
                </DialogClose>

                <Button type="submit" loading={isPending}>{t('Rename')}</Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </Tooltip>
  );
};

RenameConnectionDialog.displayName = 'RenameConnectionDialog';

export { RenameConnectionDialog };
