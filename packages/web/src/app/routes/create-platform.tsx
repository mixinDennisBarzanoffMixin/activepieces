import { SAFE_STRING_PATTERN } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { createForm, type SubmitHandler } from 'solid-hook-form';

import { platformApi } from '@/api/platforms-api';
import { queryClient } from '@/app/query-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/features/authentication/components/auth-form-template';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

type CreatePlatformSchema = {
  name: string;
};

function CreatePlatformForm() {
  const redirectAfterLogin = useRedirectAfterLogin();
  const form = createForm<CreatePlatformSchema>({
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const { mutate, isPending } = createMutation(
    () => ({
      mutationFn: platformApi.createPlatform,
      onSuccess: (data) => {
        authenticationSession.saveResponse(data, false);
        redirectAfterLogin();
      },
      onError: (error) => {
        const isBadRequest =
          api.isError(error) &&
          error.response?.status === HttpStatusCode.BadRequest;
        form.setError('root.serverError', {
          type: 'manual',
          message: isBadRequest
            ? t('Platform name cannot contain "." or "/"')
            : t('Something went wrong, please try again later'),
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
        <Label for="platformName">{t('Platform Name')}</Label>
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
          id="platformName"
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
      <Button loading={isPending} type="submit">
        {t('Create Platform')}
      </Button>
    </form>
  );
}

function CreatePlatformPage() {
  const token = authenticationSession.getToken();

  if (!token) {
    window.location.replace('/sign-in');
    return null;
  }

  if (!authenticationSession.isOnboarding()) {
    window.location.replace('/');
    return null;
  }

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "'Sentient', serif" }}
        >
          {t('Create your platform')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Give your platform a name to get started.')}
        </p>
      </div>
      <CreatePlatformForm />
    </AuthLayout>
  );
}

export { CreatePlatformPage };
