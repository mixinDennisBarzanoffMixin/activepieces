import { JSX } from 'solid-js';

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
  const { reset } = useTelemetry();
  if (!authenticationSession.isLoggedIn()) {
    authenticationSession.clearSession();
    reset();
    if (window.location.pathname === '/sign-in') {
      return null;
    }
    const searchParams = new URLSearchParams();
    searchParams.set('from', window.location.pathname + window.location.search);
    window.location.replace(`/sign-in?${searchParams.toString()}`);
    return null;
  }
  if (authenticationSession.isOnboarding()) {
    window.location.replace('/create-platform');
    return null;
  }
  platformHooks.useCurrentPlatform();
  flagsHooks.useFlags();
  projectCollectionUtils.useCurrentProject();
  return (
    <SocketProvider>
      <BadgeCelebrate />
      {props.children}
    </SocketProvider>
  );
};
