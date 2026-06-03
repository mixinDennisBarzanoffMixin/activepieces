import { Show, type JSX } from 'solid-js';

import { SocketProvider } from '@/components/providers/socket-provider';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { authenticationSession } from '../../lib/authentication-session';

import { BadgeCelebrate } from './badge-celebrate';

type AllowOnlyLoggedInUserOnlyGuardProps = {
  children: JSX.Element;
};
export const AllowOnlyLoggedInUserOnlyGuard = (
  props: AllowOnlyLoggedInUserOnlyGuardProps,
) => {
  const log = authenticationSession.isLoggedIn();
  const init = log && authenticationSession.isOnboarding();
  const telemetry = useTelemetry();
  if (!log) {
    authenticationSession.clearSession();
    telemetry.reset();
    if (window.location.pathname !== '/sign-in') {
      const params = new URLSearchParams();
      params.set('from', window.location.pathname + window.location.search);
      window.location.replace(`/sign-in?${params.toString()}`);
    }
  }
  if (log && init) {
    window.location.replace('/create-platform');
  }
  if (log && !init) {
    platformHooks.useCurrentPlatform();
    flagsHooks.useFlags();
    projectCollectionUtils.useCurrentProject();
  }
  return (
    <Show when={log && !init}>
      <SocketProvider>
        <BadgeCelebrate />
        {props.children}
      </SocketProvider>
    </Show>
  );
};
