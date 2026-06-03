import { ErrorCode, isNil } from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import { createEffect } from 'solid-js';
import { toast } from 'solid-sonner';

import { authenticationApi } from '@/api/authentication-api';
import { LoadingScreen } from '@/components/custom/loading-screen';
import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FROM_QUERY_PARAM,
  LOGIN_QUERY_PARAM,
  PROVIDER_NAME_QUERY_PARAM,
  STATE_QUERY_PARAM,
} from '@/lib/navigation-utils';

const RedirectPage = () => {
  const navigate = useNavigate();
  let hasCheckedParams = false;
  createEffect(() => {
    if (hasCheckedParams) {
      return;
    }
    console.log('redirection works, redirecting....');
    hasCheckedParams = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = tryParseState(params.get(STATE_QUERY_PARAM));
    if (state && state[LOGIN_QUERY_PARAM] && code) {
      const providerName = state[PROVIDER_NAME_QUERY_PARAM];
      const from = state[FROM_QUERY_PARAM];
      if (!providerName || !from) {
        void navigate('/sign-in');
        return;
      }
      const handleThirdPartyLogin = async () => {
        try {
          const data = await authenticationApi.claimThirdPartyRequest({
            providerName,
            code,
          });
          authenticationSession.saveResponse(data, false);
          if (isNil(data.projectId)) {
            void navigate('/create-platform');
            return;
          }
          void navigate(from);
        } catch (e) {
          if (
            api.isError(e) &&
            (e.response?.data as { code: ErrorCode }).code ===
              ErrorCode.INVITATION_ONLY_SIGN_UP
          ) {
            toast(t('Invitation only sign up'), {
              description: t(
                'Please ask your administrator to add you to the organization.',
              ),
            });
          } else {
            internalErrorToast();
          }
          console.error(e);

          void navigate('/sign-in');
        }
      };
      void handleThirdPartyLogin();
    }

    const opener: unknown = window.opener;
    if (isWindow(opener) && code) {
      opener.postMessage(
        {
          code: code,
        },
        '*',
      );
    }
    if (!window.opener && !code) {
      void navigate('/');
    }
  });

  return <LoadingScreen />;
};

const tryParseState = (state: string | null): Record<string, string> | null => {
  if (!state) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(state);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch (e) {
    return null;
  }
};

const isWindow = (value: unknown): value is Window => {
  return !!value && typeof value === 'object' && 'postMessage' in value;
};
export { RedirectPage };
