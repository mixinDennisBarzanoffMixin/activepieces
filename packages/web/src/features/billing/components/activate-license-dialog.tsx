import { createForm, reset, zodForm } from '@modular-forms/solid';
import { t } from 'i18next';
import { createMemo } from 'solid-js';
import { z } from 'zod';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { queryClient } from '@/app/query-client';
import { Input } from '@/components/ui/input';
import { platformHooks } from '@/hooks/platform-hooks';

const LicenseKeySchema = z.object({
  tempLicenseKey: z.string({ message: t('License key is invalid') }),
});

type LicenseKeySchema = z.infer<typeof LicenseKeySchema>;

interface ActivateLicenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ActivateLicenseDialog = ({
  isOpen,
  onOpenChange,
}: ActivateLicenseDialogProps) => {
  const [form, { Form, Field }] = createForm<LicenseKeySchema>({
    initialValues: {
      tempLicenseKey: '',
    },
    validate: zodForm(LicenseKeySchema),
  });
  const key = createMemo(
    () => form.internal.fields.tempLicenseKey?.value.get() ?? '',
  );

  const { mutate: activateLicenseKey, isPending } =
    platformHooks.useUpdateLisenceKey(queryClient);

  const handleSubmit = (data: LicenseKeySchema) => {
    activateLicenseKey(data.tempLicenseKey, {
      onSuccess: () => handleClose(),
    });
  };

  const handleClose = () => {
    reset(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Activate License Key')}</DialogTitle>
          <DialogDescription>
            {t('Enter your license key to unlock platform features.')}
          </DialogDescription>
        </DialogHeader>

        <Form
          class="space-y-4"
          onSubmit={handleSubmit}
        >
            <Field
              name="tempLicenseKey"
            >
              {(field, props) => (
                <div class="space-y-1">
                  <Input
                    {...props}
                    value={field.value ?? ''}
                    required
                    type="text"
                    placeholder={t('Enter your license key')}
                    disabled={isPending}
                  />
                  {field.error && (
                    <p class="text-sm font-medium text-destructive wrap-break-word">
                      {t(field.error)}
                    </p>
                  )}
                </div>
              )}
            </Field>
        </Form>

        <DialogFooter class="gap-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button
            onClick={() => form.element?.requestSubmit()}
            disabled={isPending || !key().trim()}
            class="min-w-20"
          >
            {isPending ? <LoadingSpinner class="size-4" /> : t('Activate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
