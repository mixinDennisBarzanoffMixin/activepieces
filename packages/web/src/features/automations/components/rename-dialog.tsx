import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type RenameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onInput: (value: string) => void;
  onConfirm: () => void;
  isRenaming: boolean;
};

export const RenameDialog = (props: RenameDialogProps) => {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Rename')}</DialogTitle>
          <DialogDescription>
            {t('Enter a new name for this item.')}
          </DialogDescription>
        </DialogHeader>
        <Input
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          placeholder={t('Enter new name')}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={props.onConfirm}
            disabled={!props.value.trim() || props.isRenaming}
            loading={props.isRenaming}
          >
            {t('Rename')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
