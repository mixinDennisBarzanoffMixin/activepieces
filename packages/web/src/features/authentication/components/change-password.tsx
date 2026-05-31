import { ResetPasswordRequestBody } from '@activepieces/shared';
import { t } from 'i18next';
import { Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordRequirementsList } from '@/features/authentication/components/password-validator';
import { passwordValidation } from '@/features/authentication/utils/password-validation-utils';

import { authMutations } from '../hooks/auth-hooks';

const ChangePasswordForm = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const [serverError, setServerError] = createSignal('');
  const [isPasswordFocused, setPasswordFocused] = createSignal(false);
  const [submitted, setSubmitted] = createSignal(false);
  const [password, setPassword] = createSignal('');

  const { mutate, isPending } = authMutations.useResetPassword({
    onSuccess: () => {
      toast.success(t('Your password was changed successfully'), {
        duration: 3000,
      });
      window.location.href = '/sign-in';
    },
    onError: (error) => {
      setServerError(
        t('Your password reset request has expired, please request a new one'),
      );
      console.error(error);
    },
  });

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const invalid = Object.values(passwordValidation).some(
      (rule) => rule(password()) !== true,
    );

    if (invalid) {
      return;
    }

    mutate({
      otp: queryParams.get('otpcode') || '',
      identityId: queryParams.get('identityId') || '',
      newPassword: password(),
    } satisfies ResetPasswordRequestBody);
  };

  return (
    <Card class="w-md rounded-sm drop-shadow-xl">
      <CardHeader>
        <CardTitle class="text-2xl">{t('Reset Password')}</CardTitle>
        <CardDescription>{t('Enter your new password')}</CardDescription>
      </CardHeader>
      <CardContent>
          <form className="grid gap-2" onSubmit={onSubmit}>
            <div
              class="grid space-y-2"
              onFocus={() => setPasswordFocused(true)}
            >
              <Label for="newPassword">{t('Password')}</Label>
              <Input
                required
                id="newPassword"
                type="password"
                value={password()}
                placeholder={'********'}
                class="rounded-sm"
                onBlur={() => setPasswordFocused(false)}
                onInput={(e) => setPassword(e.currentTarget.value)}
              />
              <Show when={isPasswordFocused() || submitted()}>
                <div class="border-2 bg-background p-2 rounded-md flex flex-col">
                  <PasswordRequirementsList
                    password={password()}
                    isSubmitted={submitted()}
                  />
                </div>
              </Show>
            </div>
            <Show when={serverError}>
              <p class="text-sm font-medium text-destructive">
                {serverError()}
              </p>
            </Show>
            <Button
              type="submit"
              class="w-full mt-2"
              loading={isPending}
            >
              {t('Confirm')}
            </Button>
          </form>
      </CardContent>
    </Card>
  );
};

export { ChangePasswordForm };
