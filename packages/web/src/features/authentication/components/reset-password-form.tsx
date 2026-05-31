import { CreateOtpRequestBody, OtpType } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createSignal } from 'solid-js';

import { authenticationApi } from '@/api/authentication-api';
import { queryClient } from '@/app/query-client';
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
import { CheckEmailNote } from '@/features/authentication/components/check-email-note';
import { HttpError } from '@/lib/api';

const ResetPasswordForm = () => {
  const [isSent, setIsSent] = createSignal<boolean>(false);
  const [email, setEmail] = createSignal('');

  const { mutate, isPending } = createMutation<
    void,
    HttpError,
    CreateOtpRequestBody
  >(
    () => ({
      mutationFn: authenticationApi.sendOtpEmail,
      onSuccess: () => setIsSent(true),
    }),
    () => queryClient,
  );

  const onSubmit = () => {
    mutate({ email: email().trim(), type: OtpType.PASSWORD_RESET });
  };

  return (
    <Card class="w-md rounded-sm drop-shadow-xl">
      <CardHeader>
        <CardTitle class="text-2xl">
          {isSent ? t('Check Your Inbox') : t('Reset Password')}
        </CardTitle>
        <CardDescription>
          {isSent ? (
            <CheckEmailNote
              email={email().trim().toLocaleLowerCase()}
              type={OtpType.PASSWORD_RESET}
            />
          ) : (
            <span>
              {t(
                `If the user exists we'll send you an email with a link to reset your password.`,
              )}
            </span>
          )}
        </CardDescription>
      </CardHeader>
        <CardContent>
        {!isSent && (
            <form className="grid" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
              <div class="w-full grid space-y-2">
                <Label for="email">{t('Email')}</Label>
                <Input
                  id="email"
                  value={email()}
                  type="text"
                  placeholder="email@example.com"
                  onInput={(e) => setEmail(e.currentTarget.value)}
                />
              </div>
              <Button
                type="submit"
                class="w-full mt-4"
                loading={isPending}
              >
                {t('Send Password Reset Link')}
              </Button>
            </form>
        )}
        <div className="mt-4 text-center text-sm">
          <a href="/sign-in" class="text-muted-foreground">
            {t('Back to sign in')}
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export { ResetPasswordForm };
