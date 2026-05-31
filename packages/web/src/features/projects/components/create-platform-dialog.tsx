import { SAFE_STRING_PATTERN } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createForm, type SubmitHandler } from 'solid-hook-form';

import { platformApi } from '@/api/platforms-api';
import { queryClient } from '@/app/query-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authenticationSession } from '@/lib/authentication-session';

type CreatePlatformSchema = {
  name: string;
};

function CreatePlatformDialogForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const form = createForm<CreatePlatformSchema>({
    defaultValues: { name: '' },
    mode: 'onChange',
  });

  const { mutate, isPending } = createMutation(
    () => ({
      mutationFn: platformApi.createPlatform,
      onSuccess: (data) => {
        authenticationSession.saveResponse(data, false);
        window.location.href = '/';
      },
      onError: () => {
        form.setError('root.serverError', {
          type: 'manual',
          message: t('Something went wrong, please try again later'),
        });
      },
    }),
    () => queryClient,
  );

  const onSubmit: SubmitHandler<CreatePlatformSchema> = (data) => {
    form.clearErrors('root.serverError');
    mutate({ name: data.name.trim() });
  };

  return (
    <form className="grid space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div class="grid space-y-2">
        <Label for="createPlatformName">{t('Platform Name')}</Label>
        <Input
          {...form.register('name', {
            required: t('Platform name is required'),
            maxLength: {
              value: 100,
              message: t('Platform name is too long'),
            },
            pattern: {
              value: new RegExp(SAFE_STRING_PATTERN),
              message: t('Platform name cannot contain "." or "/"'),
            },
          })}
          required
          id="createPlatformName"
          type="text"
          placeholder={t('My Platform')}
          class="rounded-sm"
          autoFocus
        />
        {form.formState.errors.name?.message && (
          <p class="text-sm font-medium text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      {form.formState.errors.root?.serverError?.message && (
        <p class="text-sm font-medium text-destructive">
          {form.formState.errors.root.serverError.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t('Cancel')}
        </Button>
        <Button loading={isPending} type="submit">
          {t('Create Platform')}
        </Button>
      </div>
    </form>
  );
}

export function CreatePlatformDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create Platform')}</DialogTitle>
        </DialogHeader>
        <CreatePlatformDialogForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
