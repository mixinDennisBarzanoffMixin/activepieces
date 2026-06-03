import {
  ApEdition,
  ApFlagId,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';
import { t } from 'i18next';
import { createEffect, createSignal, lazy, onCleanup, Show } from 'solid-js';

import { useTheme } from '@/components/providers/theme-provider';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

import { FullLogo } from '../../../components/custom/full-logo';
import { HorizontalSeparatorWithText } from '../../../components/ui/separator';
import { flagsHooks } from '../../../hooks/flags-hooks';

import { AuthAnimation } from './auth-animation';
import { SignInForm } from './sign-in-form';
import { ThirdPartyLogin } from './third-party-logins';

const SignUpForm = lazy(() =>
  import('./sign-up-form').then((m) => ({ default: m.SignUpForm })),
);

const BottomNote = (props: { isSignup: boolean }) => {
  const searchQuery = new URLSearchParams(window.location.search).toString();

  return (
    <>
      <Show
        when={props.isSignup}
        fallback={
          <div class="mt-6 text-center text-[14px] text-muted-foreground">
            {t("Don't have an account?")}
            <a
              href={`/sign-up?${searchQuery}`}
              class="pl-1 font-medium text-foreground hover:underline transition-all duration-200"
            >
              {t('Sign up')}
            </a>
          </div>
        }
      >
        <div class="mt-6 text-center text-[14px] text-muted-foreground">
          {t('Already have an account?')}
          <a
            href={`/sign-in?${searchQuery}`}
            class="pl-1 font-medium text-foreground hover:underline transition-all duration-200"
          >
            {t('Sign in')}
          </a>
        </div>
      </Show>
    </>
  );
};

const TermsFooter = () => {
  const { data: termsOfServiceUrl } = flagsHooks.useFlag<string>(
    ApFlagId.TERMS_OF_SERVICE_URL,
  );
  const { data: privacyPolicyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.PRIVACY_POLICY_URL,
  );
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (
    edition !== ApEdition.CLOUD ||
    (!termsOfServiceUrl && !privacyPolicyUrl)
  ) {
    return null;
  }

  return (
    <div class="text-center text-xs text-muted-foreground">
      {t('By continuing, you agree to our')}
      <Show when={termsOfServiceUrl}>
        <a
          href={termsOfServiceUrl}
          target="_blank"
          class="px-1 text-muted-foreground underline hover:text-primary text-xs transition-all duration-200"
        >
          {t('Terms of Service')}
        </a>
      </Show>
      {termsOfServiceUrl && privacyPolicyUrl && t('and')}
      <Show when={privacyPolicyUrl}>
        <a
          href={privacyPolicyUrl}
          target="_blank"
          class="pl-1 text-muted-foreground underline hover:text-primary text-xs transition-all duration-200"
        >
          {t('Privacy Policy')}
        </a>
      </Show>
      .
    </div>
  );
};

const AuthSeparator = (props: { isEmailAuthEnabled: boolean }) => {
  const { data: thirdPartyAuthProviders } =
    flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
    );
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const hasThirdPartyLogin =
    thirdPartyAuthProviders?.google || thirdPartyAuthProviders?.saml || isCloud;

  return (
    <Show when={hasThirdPartyLogin && props.isEmailAuthEnabled}>
      <HorizontalSeparatorWithText class="my-5 text-muted-foreground">
        {t('or')}
      </HorizontalSeparatorWithText>
    </Show>
  );
};

const AuthImage = () => {
  const [loaded, setLoaded] = createSignal(false);
  const onLoad = () => setLoaded(true);

  return (
    <img
      src="https://cdn.activepieces.com/assets/auth-bg.webp"
      alt=""
      onLoad={onLoad}
      class={cn(
        'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
        loaded() ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
};

const AuthLayout = (props: { children; isSignUp?: boolean }) => {
  const { setForceLightMode } = useTheme();
  createEffect(() => {
    setForceLightMode(true);
    onCleanup(() => setForceLightMode(false));
  });
  return (
    <div class="h-screen w-full overflow-hidden flex bg-white relative">
      {/* Form — left side */}
      <div class="flex flex-col w-full lg:w-1/2 p-5 lg:px-[100px]">
        <div class="pt-3 flex justify-center">
          <FullLogo />
        </div>
        <div class="flex-1 flex items-center justify-center">
          <div class="w-full max-w-xs overflow-y-auto px-1">
            {props.children}
          </div>
        </div>
        <Show when={props.isSignUp}>
          <div class="pb-4">
            <TermsFooter />
          </div>
        </Show>
      </div>

      {/* Right side — animation for sign-up, image for sign-in */}
      <div class="hidden lg:flex w-1/2 py-5 pr-5">
        <div class="relative w-full h-full rounded-2xl overflow-hidden bg-muted">
          <Show when={props.isSignUp} fallback={<AuthImage />}>
            <AuthAnimation />
          </Show>
        </div>
      </div>
    </div>
  );
};

const AuthFormTemplate = (props: { form: 'signin' | 'signup' }) => {
  const isSignUp = props.form === 'signup';
  const token = authenticationSession.getToken();
  const redirectAfterLogin = useRedirectAfterLogin();
  const [showCheckYourEmailNote, setShowCheckYourEmailNote] =
    createSignal(false);
  const { data: isEmailAuthEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.EMAIL_AUTH_ENABLED,
  );
  const data = {
    signin: {
      title: t('Welcome back'),
      description: t('Sign in to pick up where you left off.'),
    },
    signup: {
      title: t('Create a new account'),
      description: t('Join thousands of teams running on autopilot.'),
    },
  }[props.form];

  createEffect(() => {
    if (token) {
      redirectAfterLogin();
    }
  });

  if (token) {
    return null;
  }

  return (
    <AuthLayout isSignUp={isSignUp}>
      <Show when={!showCheckYourEmailNote()}>
        <div class="mb-6 text-center">
          <h1
            class="text-2xl font-bold tracking-tight"
            style={{ 'font-family': "'Sentient', serif" }}
          >
            {data.title}
          </h1>
        </div>
      </Show>

      <Show when={!showCheckYourEmailNote()}>
        <ThirdPartyLogin isSignUp={isSignUp} />
      </Show>
      <AuthSeparator
        isEmailAuthEnabled={
          (isEmailAuthEnabled || isEmailAuthEnabled === undefined) &&
          !showCheckYourEmailNote()
        }
      />

      {isEmailAuthEnabled ? (
        isSignUp ? (
          <SignUpForm
            setShowCheckYourEmailNote={setShowCheckYourEmailNote}
            showCheckYourEmailNote={showCheckYourEmailNote()}
          />
        ) : (
          <SignInForm />
        )
      ) : null}

      <BottomNote isSignup={isSignUp} />
    </AuthLayout>
  );
};

export { AuthFormTemplate, AuthLayout };
