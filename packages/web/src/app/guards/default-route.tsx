import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { determineDefaultRoute } from '@/lib/route-utils';

export const DefaultRoute = () => {
  const token = authenticationSession.getToken();
  const { checkAccess } = useAuthorization();
  if (!token) {
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
  window.location.replace(determineDefaultRoute(checkAccess));
  return null;
};
