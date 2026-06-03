import { FolderDto, UncategorizedFolderId } from '@activepieces/shared';
import { t } from 'i18next';
import { FolderIcon } from 'lucide-solid';
import { For } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type MoveToFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderDto[] | undefined;
  selectedFolderId: string;
  onFolderChange: (folderId: string) => void;
  onConfirm: () => void;
  isMoving: boolean;
};

export const MoveToFolderDialog = (props: MoveToFolderDialogProps) => {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Move to Folder')}</DialogTitle>
          <DialogDescription>
            {t('Choose a destination folder for the selected items.')}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-2">
          <Label>{t('Folder')}</Label>
          <Select
            value={props.selectedFolderId}
            onValueChange={props.onFolderChange}
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder={t('Select a folder').toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UncategorizedFolderId}>
                <FolderIcon class="mr-2 h-4 w-4" />
                {t('Uncategorized (No Folder)')}
              </SelectItem>
              {
                <For each={props.folders}>
                  {(folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <FolderIcon class="mr-2 h-4 w-4" />
                      {folder.displayName}
                    </SelectItem>
                  )}
                </For>
              }
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={props.onConfirm}
            disabled={!props.selectedFolderId || props.isMoving}
            loading={props.isMoving}
          >
            {t('Move')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
