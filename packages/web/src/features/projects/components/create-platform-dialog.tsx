import { SAFE_STRING_PATTERN } from '@activepieces/shared';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createForm, type SubmitHandler } from 'solid-hook-form';
import { createSignal, Show } from 'solid-js';

import { platformApi } from '@/api/platforms-api';
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

function CreatePlatformDialogForm(props: {
  onOpenChange: (open: boolean) => void;
}) {
  const form = createForm<CreatePlatformSchema>({
    defaultValues: { name: '' },
    mode: 'onInput',
  });
  const queryClient = useQueryClient();
  const [err, setErr] = createSignal('');

  const { mutate, isPending } = createMutation(
    () => ({
      mutationFn: (request: CreatePlatformSchema) =>
        platformApi.createPlatform(request),
      onSuccess: (data) => {
        authenticationSession.saveResponse(data, false);
        window.location.href = '/';
      },
      onError: () => {
        setErr(t('Something went wrong, please try again later'));
      },
    }),
    () => queryClient,
  );

  const onSubmit: SubmitHandler<CreatePlatformSchema> = (data) => {
    setErr('');
    mutate({ name: data.name.trim() });
  };
  const name = form.register('name', {
    required: t('Platform name is required'),
    maxLength: {
      value: 100,
      message: t('Platform name is too long'),
    },
    pattern: {
      value: new RegExp(SAFE_STRING_PATTERN),
      message: t('Platform name cannot contain "." or "/"'),
    },
  });

  return (
    <form class="grid space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div class="grid space-y-2">
        <Label for="createPlatformName">{t('Platform Name')}</Label>
        <Input
          {...name}
          required
          id="createPlatformName"
          type="text"
          placeholder={t('My Platform')}
          class="rounded-sm"
          autoFocus
        />
        <Show when={form.formState.errors.name?.message}>
          <p class="text-sm font-medium text-destructive">
            {form.formState.errors.name.message}
          </p>
        </Show>
      </div>
      <Show when={err()}>
        <p class="text-sm font-medium text-destructive">{err()}</p>
      </Show>
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => props.onOpenChange(false)}
        >
          {t('Cancel')}
        </Button>
        <Button loading={isPending} type="submit">
          {t('Create Platform')}
        </Button>
      </div>
    </form>
  );
}

export function CreatePlatformDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create Platform')}</DialogTitle>
        </DialogHeader>
        <CreatePlatformDialogForm
          key={props.open ? 'open' : 'closed'}
          onOpenChange={props.onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
