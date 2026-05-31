import { isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

export default function ProjectSettingsLayout({
  children,
}: {
  children: JSX.Element;
}) {
  const currentProjectId = authenticationSession.getProjectId();

  if (isNil(currentProjectId)) {
    window.location.replace('/sign-in');
    return null;
  }

  return <div className="w-full">{children}</div>;
}
