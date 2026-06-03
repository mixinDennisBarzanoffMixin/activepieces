import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { MailCheck, MailX } from 'lucide-solid';
import { createEffect, createSignal, Show } from 'solid-js';

import { FullLogo } from '@/components/custom/full-logo';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Card } from '@/components/ui/card';
import { internalErrorToast } from '@/components/ui/sonner';
import { usePartnerStack } from '@/hooks/use-partner-stack';
import { api } from '@/lib/api';

import { authMutations } from '../hooks/auth-hooks';

const VerifyEmail = () => {
  const [isExpired, setIsExpired] = createSignal(false);
  const searchParams = new URLSearchParams(window.location.search);
  const otp = searchParams.get('otpcode');
  const identityId = searchParams.get('identityId');
  let hasMutated = false;
  const { reportSignup } = usePartnerStack();

  const { mutate, isPending } = authMutations.useVerifyEmail({
    onSuccess: ({ email, firstName }) => {
      reportSignup(email, firstName);
      setTimeout(() => window.location.assign('/sign-in'), 5000);
    },
    onError: (error) => {
      if (
        api.isError(error) &&
        error.response?.status === HttpStatusCode.Gone
      ) {
        setIsExpired(true);
        setTimeout(() => window.location.assign('/sign-in'), 5000);
      } else {
        console.error(error);
        internalErrorToast();
        setTimeout(() => window.location.assign('/sign-in'), 5000);
      }
    },
  });

  createEffect(() => {
    if (otp && identityId && !hasMutated) {
      mutate({ otp, identityId });
      hasMutated = true;
    }
  });

  if (!otp || !identityId) {
    window.location.replace('/sign-in');
    return null;
  }
  return (
    <div class="mx-auto h-screen w-screen flex flex-col items-center justify-center gap-2">
      <FullLogo />

      <Card class="w-md rounded-sm drop-shadow-xl p-4">
        <div class="gap-2 w-full flex flex-col">
          <div class="gap-4 w-full flex flex-row items-center justify-center">
            <Show when={!isPending && !isExpired}>
              <>
                <MailCheck class="w-16 h-16" />
                <span class="text-left w-fit">
                  {t(
                    'Email has been verified. You will be redirected to sign in...',
                  )}
                </span>
              </>
            </Show>
            <Show when={isPending && !isExpired}>
              <>
                <LoadingSpinner class="size-6" />
                <span class="text-left w-fit">{t('Verifying email...')}</span>
              </>
            </Show>

            <Show when={isExpired}>
              <>
                <MailX class="w-16 h-16" />
                <div class="text-left w-fit">
                  <div>
                    {t(
                      'invitation has expired, once you sign in again you will be able to resend the verification email.',
                    )}
                  </div>
                  <div>{t('Redirecting to sign in...')}</div>
                </div>
              </>
            </Show>
          </div>
        </div>
      </Card>
    </div>
  );
};

export { VerifyEmail };
