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

const SignUpForm = (props: {
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
  const first = form.register('firstName', {
    required: t('First name is required'),
  });
  const last = form.register('lastName', {
    required: t('Last name is required'),
  });
  const email = form.register('email', {
    required: t('Email is required'),
    validate: (value) =>
      formatUtils.emailRegex.test(value) || t('Email is invalid'),
  });
  const pass = form.register('password', {
    required: t('Password is required'),
    validate: (value) => {
      if (typeof value !== 'string') {
        return t('Password is required');
      }
      return Object.values(passwordValidation)
        .map((rule) => rule(value))
        .find((error) => error !== true);
    },
  });
  const errors = createMemo(() => form.formState.errors);
  const firstError = createMemo(() => errors().firstName?.message);
  const lastError = createMemo(() => errors().lastName?.message);
  const emailError = createMemo(() => errors().email?.message);
  const passError = createMemo(() => errors().password?.message);

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
      props.setShowCheckYourEmailNote(true);
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
        props.setShowCheckYourEmailNote(true);
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

  return (
    <Show
      when={!props.showCheckYourEmailNote}
      fallback={
        <div class="pt-6">
          <CheckEmailNote
            email={form.getValues('email').trim().toLowerCase()}
            type={OtpType.EMAIL_VERIFICATION}
          />
        </div>
      }
    >
      <form
        onSubmit={form.handleSubmit(submit)}
        class="flex flex-col space-y-4"
      >
        <div class="flex flex-row gap-2">
          <div class="w-full">
            <Label for="firstName">{t('First Name')}</Label>
            <Input
              {...first}
              required
              id="firstName"
              type="text"
              placeholder="John"
              class="rounded-sm"
              data-testid="sign-up-first-name"
            />
            <Show when={firstError()}>
              <p class="text-sm font-medium text-destructive">{firstError()}</p>
            </Show>
          </div>
          <div class="w-full">
            <Label for="lastName">{t('Last Name')}</Label>
            <Input
              {...last}
              required
              id="lastName"
              type="text"
              placeholder="Doe"
              class="rounded-sm"
              data-testid="sign-up-last-name"
            />
            <Show when={lastError()}>
              <p class="text-sm font-medium text-destructive">{lastError()}</p>
            </Show>
          </div>
        </div>
        <div class="grid space-y-1">
          <Label for="email">{t('Email')}</Label>
          <Input
            {...email}
            required
            id="email"
            type="email"
            placeholder="email@example.com"
            class="rounded-sm"
            data-testid="sign-up-email"
          />
          <Show when={emailError()}>
            <p class="text-sm font-medium text-destructive">{emailError()}</p>
          </Show>
        </div>
        <div class="grid space-y-1">
          <Label for="password">{t('Password')}</Label>
          <div class="relative flex items-center">
            <Input
              {...pass}
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
            <div class="absolute right-1 flex items-center gap-0.5">
              <PasswordStrengthBolt password={password()} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <Show when={showPassword()} fallback={<Eye class="w-4 h-4" />}>
                  <EyeOff class="w-4 h-4" />
                </Show>
              </Button>
            </div>
            <Show when={focused()}>
              <div class="absolute left-[calc(100%+0.375rem)] top-1/2 z-50 w-max -translate-y-1/2 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
                <div class="absolute -left-[4.5px] top-1/2 -translate-y-1/2">
                  <div class="w-2.5 h-2.5 rotate-45 bg-popover border-l border-b border-border" />
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
          <Show when={passError()}>
            <p class="text-sm font-medium text-destructive">{passError()}</p>
          </Show>
        </div>
        <Show when={showNewsLetterCheckbox()}>
          <div class="flex items-center gap-2">
            <Checkbox
              id="newsLetter"
              class="m-0!"
              checked={form.values().newsLetter}
              onCheckedChange={(value) =>
                form.setValue('newsLetter', value === true)
              }
            />
            <Label for="newsLetter" class="text-xs">
              {t('Get emails about updates and newsletters')}
            </Label>
          </div>
        </Show>
        <Show when={serverError()}>
          <p class="text-sm font-medium text-destructive">{serverError()}</p>
        </Show>
        <Button loading={isPending} type="submit" data-testid="sign-up-button">
          {t('Sign up')}
        </Button>
      </form>
    </Show>
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
