import {
  OtpType,
  ApEdition,
  ApFlagId,
  ErrorCode,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-solid';
import { createForm, type SubmitHandler } from 'solid-hook-form';
import { Show, createEffect, createMemo, createSignal } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckEmailNote } from '@/features/authentication/components/check-email-note';
import {
  PasswordRequirementsList,
  PasswordStrengthBolt,
} from '@/features/authentication/components/password-validator';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

import { authMutations } from '../hooks/auth-hooks';
import { passwordValidation } from '../utils/password-validation-utils';

const SignUpForm = ({
  showCheckYourEmailNote,
  setShowCheckYourEmailNote,
}: {
  showCheckYourEmailNote: boolean;
  setShowCheckYourEmailNote: (value: boolean) => void;
}) => {
  const searchParams = new URLSearchParams(window.location.search);
  const [showPassword, setShowPassword] = createSignal(false);
  const [focused, setFocused] = createSignal(false);
  const [serverError, setServerError] = createSignal('');
  const [password, setPassword] = createSignal('');
  const form = createForm<SignUpSchema>({
    defaultValues: {
      newsLetter: false,
      password: '',
      email: searchParams.get('email') || '',
      firstName: '',
      lastName: '',
    },
  });

  const branding = flagsHooks.useWebsiteBranding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const showNewsLetterCheckbox = createMemo(() => {
    const websiteName = branding()?.websiteName;
    if (!edition || !websiteName) {
      return false;
    }
    if (edition === ApEdition.CLOUD) {
      return (
        typeof websiteName === 'string' &&
        websiteName.toLowerCase() === 'activepieces'
      );
    }
    return edition === ApEdition.COMMUNITY;
  });

  createEffect(() => {
    if (showNewsLetterCheckbox()) {
      form.setValue('newsLetter', true);
    }
  });

  const redirectAfterLogin = useRedirectAfterLogin();

  const { mutate, isPending } = authMutations.useSignUp({
    onSuccess: (data) => {
      if (data.verified) {
        authenticationSession.saveResponse(data, false);

        if (isNil(data.projectId)) {
          window.location.assign('/create-platform');
          return;
        }
        redirectAfterLogin();
        return;
      }
      setShowCheckYourEmailNote(true);
    },
    onError: (error) => {
      if (!api.isError(error)) {
        return;
      }
      const code = (error.response?.data as { code: ErrorCode } | undefined)
        ?.code;
      if (isNil(code)) {
        setServerError(t('Something went wrong, please try again later'));
        return;
      }
      if (code === ErrorCode.EMAIL_IS_NOT_VERIFIED) {
        setShowCheckYourEmailNote(true);
        return;
      }
      if (code === ErrorCode.INVITATION_ONLY_SIGN_UP) {
        setServerError(
          t(
            'Sign up is restricted. You need an invitation to join. Please contact the administrator.',
          ),
        );
        return;
      }
      if (code === ErrorCode.EXISTING_USER) {
        setServerError(t('Email is already used'));
        return;
      }
      if (code === ErrorCode.EMAIL_AUTH_DISABLED) {
        setServerError(t('Email authentication is disabled'));
        return;
      }
      if (code === ErrorCode.DOMAIN_NOT_ALLOWED) {
        setServerError(t('Email domain is disallowed'));
        return;
      }
      setServerError(t('Something went wrong, please try again later'));
    },
  });

  const submit: SubmitHandler<SignUpSchema> = (data) => {
    setServerError('');
    mutate({
      ...data,
      email: data.email.trim().toLowerCase(),
      trackEvents: true,
    });
  };

  if (showCheckYourEmailNote) {
    return (
      <div className="pt-6">
        <CheckEmailNote
          email={form.getValues('email').trim().toLowerCase()}
          type={OtpType.EMAIL_VERIFICATION}
        />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} class="flex flex-col space-y-4">
      <div className="flex flex-row gap-2">
        <div class="w-full">
          <Label for="firstName">{t('First Name')}</Label>
          <Input
            {...form.register('firstName', { required: t('First name is required') })}
            required
            id="firstName"
            type="text"
            placeholder="John"
            class="rounded-sm"
            data-testid="sign-up-first-name"
          />
          {form.formState.errors.firstName?.message && (
            <p class="text-sm font-medium text-destructive">
              {form.formState.errors.firstName.message}
            </p>
          )}
        </div>
        <div class="w-full">
          <Label for="lastName">{t('Last Name')}</Label>
          <Input
            {...form.register('lastName', { required: t('Last name is required') })}
            required
            id="lastName"
            type="text"
            placeholder="Doe"
            class="rounded-sm"
            data-testid="sign-up-last-name"
          />
          {form.formState.errors.lastName?.message && (
            <p class="text-sm font-medium text-destructive">
              {form.formState.errors.lastName.message}
            </p>
          )}
        </div>
      </div>
      <div class="grid space-y-1">
        <Label for="email">{t('Email')}</Label>
        <Input
          {...form.register('email', {
            required: t('Email is required'),
            validate: (value) =>
              formatUtils.emailRegex.test(value) || t('Email is invalid'),
          })}
          required
          id="email"
          type="email"
          placeholder="email@example.com"
          class="rounded-sm"
          data-testid="sign-up-email"
        />
        {form.formState.errors.email?.message && (
          <p class="text-sm font-medium text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <div class="grid space-y-1">
        <Label for="password">{t('Password')}</Label>
        <div className="relative flex items-center">
          <Input
            {...form.register('password', {
              required: t('Password is required'),
              validate: (value) => {
                if (typeof value !== 'string') {
                  return t('Password is required');
                }
                return Object.values(passwordValidation)
                  .map((rule) => rule(value))
                  .find((error) => error !== true);
              },
            })}
            required
            id="password"
            type={showPassword() ? 'text' : 'password'}
            placeholder="********"
            class="rounded-sm pr-16"
            data-testid="sign-up-password"
            onInput={(event) => {
              form.setValue('password', event.currentTarget.value, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              });
              setPassword(event.currentTarget.value);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <div className="absolute right-1 flex items-center gap-0.5">
            <PasswordStrengthBolt password={password()} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              {showPassword() ? (
                <EyeOff class="w-4 h-4" />
              ) : (
                <Eye class="w-4 h-4" />
              )}
            </Button>
          </div>
          <Show when={focused()}>
            <div class="absolute left-[calc(100%+0.375rem)] top-1/2 z-50 w-max -translate-y-1/2 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
              <div className="absolute -left-[4.5px] top-1/2 -translate-y-1/2">
                <div className="w-2.5 h-2.5 rotate-45 bg-popover border-l border-b border-border" />
              </div>
              <div class="mb-2 flex flex-col gap-1 text-sm">
                <div class="text-xs font-medium">
                  {t('Password Requirements')}
                </div>
              </div>
              <PasswordRequirementsList
                password={password()}
                isSubmitted={form.formState.submitCount() > 0}
              />
            </div>
          </Show>
        </div>
        {form.formState.errors.password?.message && (
          <p class="text-sm font-medium text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      {showNewsLetterCheckbox() && (
        <div class="flex items-center gap-2">
          <Checkbox
            id="newsLetter"
            class="m-0!"
            checked={form.values().newsLetter}
            onCheckedChange={(value) => form.setValue('newsLetter', value)}
          />
          <Label for="newsLetter" class="text-xs">
            {t('Get emails about updates and newsletters')}
          </Label>
        </div>
      )}
      {serverError() && (
        <p class="text-sm font-medium text-destructive">{serverError()}</p>
      )}
      <Button loading={isPending} type="submit" data-testid="sign-up-button">
        {t('Sign up')}
      </Button>
    </form>
  );
};

export { SignUpForm };

type SignUpSchema = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  newsLetter: boolean;
};
