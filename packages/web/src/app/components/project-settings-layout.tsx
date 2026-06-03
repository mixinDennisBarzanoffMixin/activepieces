import { isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

export default function ProjectSettingsLayout(props: {
  children: JSX.Element;
}) {
  const currentProjectId = authenticationSession.getProjectId();

  if (isNil(currentProjectId)) {
    window.location.replace('/sign-in');
    return null;
  }

  return <div class="w-full">{props.children}</div>;
}
