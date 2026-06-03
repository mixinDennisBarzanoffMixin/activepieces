import {
  OtpType,
  ApEdition,
  ApFlagId,
  AuthenticationResponse,
  ErrorCode,
  isNil,
  SignInRequest,
} from '@activepieces/shared';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';

import { authenticationApi } from '@/api/authentication-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flagsHooks } from '@/hooks/flags-hooks';
import { HttpError, api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

import { CheckEmailNote } from './check-email-note';

const SignInForm = () => {
  const [showCheckYourEmailNote, setShowCheckYourEmailNote] =
    createSignal(false);
  const [showPassword, setShowPassword] = createSignal(false);
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const queryClient = useQueryClient();

  const { data: edition } = flagsHooks.useFlag(ApFlagId.EDITION);

  const redirectAfterLogin = useRedirectAfterLogin();

  const { mutate, isPending } = createMutation<
    AuthenticationResponse,
    HttpError,
    SignInRequest
  >(
    () => ({
      mutationFn: (request) => authenticationApi.signIn(request),
      onSuccess: (data) => {
        authenticationSession.saveResponse(data, false);

        if (isNil(data.projectId)) {
          window.location.assign('/create-platform');
          return;
        }
        redirectAfterLogin();
      },
      onError: (err) => {
        if (!api.isError(err)) {
          return;
        }
        const code = (err.response?.data as { code: ErrorCode } | undefined)
          ?.code;
        if (isNil(code)) {
          setError(t('Something went wrong, please try again later'));
          return;
        }
        if (code === ErrorCode.INVALID_CREDENTIALS) {
          setError(t('Invalid email or password'));
          return;
        }
        if (code === ErrorCode.USER_IS_INACTIVE) {
          setError(t('User has been deactivated'));
          return;
        }
        if (code === ErrorCode.EMAIL_IS_NOT_VERIFIED) {
          setShowCheckYourEmailNote(true);
          return;
        }
        if (code === ErrorCode.DOMAIN_NOT_ALLOWED) {
          setError(t(`Email domain is disallowed`));
          return;
        }
        if (code === ErrorCode.EMAIL_AUTH_DISABLED) {
          setError(t(`Email authentication has been disabled`));
          return;
        }
        setError(t('Something went wrong, please try again later'));
      },
    }),
    () => queryClient,
  );

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    setError('');
    if (!formatUtils.emailRegex.test(email())) {
      setError(t('Email is invalid'));
      return;
    }
    if (!password()) {
      setError(t('Password is required'));
      return;
    }
    mutate({ email: email(), password: password() } satisfies SignInRequest);
  };

  return (
    <>
      <form class="grid space-y-4" onSubmit={onSubmit}>
        <div class="grid space-y-2">
          <Label for="email">{t('Email')}</Label>
          <Input
            required
            id="email"
            value={email()}
            type="text"
            placeholder={'email@example.com'}
            class="rounded-sm"
            tabIndex={1}
            data-testid="sign-in-email"
            onInput={(e) => {
              setEmail(e.currentTarget.value);
              setShowCheckYourEmailNote(false);
            }}
          />
        </div>
        <div class="grid space-y-2">
          <div class="flex items-center justify-between">
            <Label for="password">{t('Password')}</Label>
            <Show when={edition !== ApEdition.COMMUNITY}>
              <a
                href="/forget-password"
                class="text-muted-foreground text-xs hover:text-primary transition-all duration-200"
              >
                {t('Forgot your password?')}
              </a>
            </Show>
          </div>
          <div class="relative">
            <Input
              required
              id="password"
              value={password()}
              type={showPassword() ? 'text' : 'password'}
              placeholder={'********'}
              class="rounded-sm pr-10"
              tabIndex={2}
              data-testid="sign-in-password"
              onInput={(e) => setPassword(e.currentTarget.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              class="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <Show when={showPassword()} fallback={<Eye class="w-4 h-4" />}>
                <EyeOff class="w-4 h-4" />
              </Show>
            </Button>
          </div>
        </div>
        <Show when={error()}>
          <p class="text-sm font-medium text-destructive">{error()}</p>
        </Show>
        <Button
          type="submit"
          loading={isPending}
          tabIndex={3}
          data-testid="sign-in-button"
        >
          {t('Sign in')}
        </Button>
      </form>

      <Show when={showCheckYourEmailNote()}>
        <div class="mt-4">
          <CheckEmailNote email={email()} type={OtpType.EMAIL_VERIFICATION} />
        </div>
      </Show>
    </>
  );
};

export { SignInForm };
