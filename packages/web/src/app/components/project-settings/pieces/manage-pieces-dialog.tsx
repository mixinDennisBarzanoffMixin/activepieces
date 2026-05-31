import { PiecesFilterType } from '@activepieces/shared';
import { t } from 'i18next';
import { createEffect, createSignal } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { piecesHooks } from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects';

import { MultiSelectPieceProperty } from '../../../../components/custom/multi-select-piece-property';
import { authenticationSession } from '../../../../lib/authentication-session';

type ManagePiecesDialogProps = {
  onSuccess: () => void;
};

export const ManagePiecesDialog = ({ onSuccess }: ManagePiecesDialogProps) => {
  const [open, setOpen] = createSignal(false);
  const [pieces, setPieces] = createSignal<string[]>([]);
  const { pieces: visiblePieces, isLoading: isLoadingVisiblePieces } =
    piecesHooks.usePieces({ searchQuery: '', includeHidden: false });

  createEffect(() => {
    setPieces((visiblePieces ?? []).map((p) => p.name));
  });

  const { pieces: allPieces, isLoading: isLoadingAllPieces } =
    piecesHooks.usePieces({ searchQuery: '', includeHidden: true });

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="default" class="flex gap-2 items-center">
          {t('Manage Pieces')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Manage Pieces')}</DialogTitle>
          <DialogDescription>
            {t(
              'Choose which pieces you want to be available for your current project users',
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mb-4">
          <div class="grid space-y-2">
            <Label for="pieces">{t('Pieces')}</Label>
            <MultiSelectPieceProperty
              placeholder={t('Pieces')}
              options={
                allPieces?.map((piece) => ({
                  value: piece.name,
                  label: piece.displayName,
                })) ?? []
              }
              loading={isLoadingAllPieces || isLoadingVisiblePieces}
              onChange={(value) => setPieces(value?.map(String) ?? [])}
              initialValues={pieces()}
              showDeselect={pieces().length > 0}
            ></MultiSelectPieceProperty>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              projectCollectionUtils.update(authenticationSession.getProjectId()!, {
                plan: {
                  piecesFilterType: PiecesFilterType.ALLOWED,
                  pieces: pieces(),
                },
              });
              onSuccess();
              setOpen(false);
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
