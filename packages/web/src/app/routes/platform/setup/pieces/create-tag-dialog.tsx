import { Tag } from '@activepieces/shared';
import { t } from 'i18next';
import { createSignal } from 'solid-js';
import type { JSX } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { piecesTagMutations } from '@/features/platform-admin';

type CreateTagDialogProps = {
  onTagCreated: (tag: Tag) => void;
  children: JSX.Element;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function CreateTagDialog(props: CreateTagDialogProps) {
  const [tagName, setTagName] = createSignal('');

  const { mutate, isPending } = piecesTagMutations.useCreateTag({
    onTagCreated: props.onTagCreated,
    setIsOpen: props.setIsOpen,
  });

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (tagName().trim()) {
      mutate(tagName().trim());
    }
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => props.setIsOpen(open)}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div class="flex flex-col gap-4">
            <Label for="tagName">{t('Tag')}</Label>
            <Input
              id="tagName"
              value={tagName}
              onChange={(e) => setTagName(e.currentTarget.value)}
              class="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="submit" loading={isPending}>
              {t('Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
