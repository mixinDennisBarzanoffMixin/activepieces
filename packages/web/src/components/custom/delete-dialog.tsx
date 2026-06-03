import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-solid';
import { createSignal, Show, type JSXElement } from 'solid-js';
import { toast } from 'solid-sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface ConfirmationDeleteDialogProps {
  title: string;
  message: JSXElement;
  mutationFn: () => Promise<unknown>;
  entityName: string;
  children?: JSXElement;
  open?: boolean;
  isDanger?: boolean;
  buttonText?: string;
  onOpenChange?: (open: boolean) => void;
  showToast?: boolean;
  onError?: (error: Error) => void;
  warning?: JSXElement;
}

export const ConfirmationDeleteDialog = (
  props: ConfirmationDeleteDialogProps,
) => {
  const [isUncontrolledOpen, setIsUncontrolledOpen] = createSignal(false);
  const isControlled = () =>
    props.open !== undefined && props.onOpenChange !== undefined;

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: props.mutationFn,
    onSuccess: () => {
      handleClose();
      if (props.showToast) {
        toast.success(
          t('Removed {entityName}', { entityName: props.entityName }),
        );
      }
    },
    onError: props.onError,
  }));

  const handleClose = () => {
    if (isControlled()) {
      props.onOpenChange?.(false);
    } else {
      setIsUncontrolledOpen(false);
    }
  };

  const isOpen = () => (isControlled() ? props.open : isUncontrolledOpen());

  return (
    <Dialog
      open={isOpen()}
      onOpenChange={(open) => {
        if (isControlled()) {
          props.onOpenChange?.(open);
          return;
        }
        setIsUncontrolledOpen(open);
      }}
    >
      <Show when={props.children}>
        <DialogTrigger asChild>{props.children}</DialogTrigger>
      </Show>

      <DialogContent onClick={(e: MouseEvent) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription class="pt-2">{props.message}</DialogDescription>
        </DialogHeader>
        <Show when={props.warning}>
          <Alert variant="warning">
            <TriangleAlert class="h-4 w-4" />
            <AlertDescription>{props.warning}</AlertDescription>
          </Alert>
        </Show>
        <DialogFooter class="mt-3">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => handleClose()}
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={() => mutate()}
          >
            <Show when={props.isDanger}>
              <TriangleAlert class="size-4 mr-2" />
            </Show>
            {props.buttonText || t('Remove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
