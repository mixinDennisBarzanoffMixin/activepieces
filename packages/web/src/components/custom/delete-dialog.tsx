import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-solid';
import { createSignal } from 'solid-js';
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
  message: any | string;
  mutationFn: () => Promise<void>;
  entityName: string;
  children?: any;
  open?: boolean;
  isDanger?: boolean;
  buttonText?: string;
  onOpenChange?: (open: boolean) => void;
  showToast?: boolean;
  onError?: (error: Error) => void;
  warning?: any | string;
}

export const ConfirmationDeleteDialog = ({
  title,
  message,
  mutationFn,
  showToast,
  isDanger,
  entityName,
  buttonText,
  children,
  open,
  onError,
  onOpenChange,
  warning,
}: ConfirmationDeleteDialogProps) => {
  const [isControlled] = createSignal(
    open !== undefined && onOpenChange !== undefined,
  );
  const [isUncontrolledOpen, setIsUncontrolledOpen] = createSignal(false);

  const { mutate, isPending } = createMutation(() => ({
    mutationFn,
    onSuccess: () => {
      handleClose();
      if (showToast) {
        toast.success(t('Removed {entityName}', { entityName }));
      }
    },
    onError,
  }));

  const handleClose = () => {
    if (isControlled()) {
      onOpenChange?.(false);
    } else {
      setIsUncontrolledOpen(false);
    }
  };

  const isOpen = isControlled() ? open : isUncontrolledOpen();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={isControlled() ? onOpenChange : setIsUncontrolledOpen}
    >
      <Show when={children}>
        <DialogTrigger asChild>{children}</DialogTrigger>
      </Show>

      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription class="pt-2">{message}</DialogDescription>
        </DialogHeader>
        <Show when={warning}>
          <Alert variant="warning">
            <TriangleAlert class="h-4 w-4" />
            <AlertDescription>{warning}</AlertDescription>
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
            <Show when={isDanger}>
              <TriangleAlert class="size-4 mr-2" />
            </Show>
            {buttonText || t('Remove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
