import { isNil } from '@activepieces/shared';
import { useParams } from '@solidjs/router';
import { t } from 'i18next';
import { JSX } from 'solid-js';
import { toast } from 'solid-sonner';

import { projectCollectionUtils } from '@/features/projects';
import {
  FROM_QUERY_PARAM,
  useDefaultRedirectPath,
} from '@/lib/navigation-utils';

import { authenticationSession } from '../../lib/authentication-session';
import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';

export const TokenCheckerWrapper = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const params = useParams();
  const projectIdFromParams = params.projectId;

  if (isNil(projectIdFromParams)) {
    window.location.replace('/sign-in');
    return null;
  }
  const hasAccessToProject =
    projectCollectionUtils.useHasAccessToProject(projectIdFromParams);

  if (!hasAccessToProject) {
    toast.error(t('Invalid Access'), {
      description: t(
        'You tried to access a project that you do not have access to.',
      ),
      duration: 10000,
    });
    window.location.replace('/');
    return null;
  }

  authenticationSession.switchToProject(projectIdFromParams);

  return <>{children}</>;
};

type RedirectToCurrentProjectRouteProps = {
  path: string;
  children: JSX.Element;
};

const RedirectToCurrentProjectRoute = ({
  path,
}: RedirectToCurrentProjectRouteProps) => {
  const currentProjectId = authenticationSession.getProjectId();
  const params = useParams();
  const defaultRedirectPath = useDefaultRedirectPath();
  const searchParams = new URLSearchParams(window.location.search);
  const from = searchParams.get(FROM_QUERY_PARAM) ?? defaultRedirectPath;
  if (isNil(currentProjectId)) {
    if (window.location.pathname === '/sign-in') {
      return null;
    }
    window.location.replace(`/sign-in?${new URLSearchParams({ from }).toString()}`);
    return null;
  }

  const pathWithParams = `${path.startsWith('/') ? path : `/${path}`}`.replace(
    /:(\w+)/g,
    (_, param) => params[param] ?? '',
  );

  const searchParamsString = searchParams.toString();
  const pathWithParamsAndSearchParams = `${pathWithParams}${
    searchParamsString ? `?${searchParamsString}` : ''
  }`;
  window.location.replace(`/projects/${currentProjectId}${pathWithParamsAndSearchParams}`);
  return null;
};

interface ProjectRouterWrapperProps {
  path: string;
  component: () => JSX.Element;
}

export const ProjectRouterWrapper = ({
  component: Component,
  path,
}: ProjectRouterWrapperProps) => [
  {
    path: `/projects/:projectId${path.startsWith('/') ? path : `/${path}`}`,
    component: () => (
      <AllowOnlyLoggedInUserOnlyGuard>
        <TokenCheckerWrapper>
          <Component />
        </TokenCheckerWrapper>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
  {
    path,
    component: () => (
      <AllowOnlyLoggedInUserOnlyGuard>
        <RedirectToCurrentProjectRoute path={path}>
          <Component />
        </RedirectToCurrentProjectRoute>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
];
