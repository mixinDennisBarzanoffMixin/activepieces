import { isNil } from '@activepieces/shared';
import { useParams } from '@solidjs/router';
import { t } from 'i18next';
import { createEffect, createMemo, Show, type JSX } from 'solid-js';
import { toast } from 'solid-sonner';

import { projectCollectionUtils } from '@/features/projects';
import {
  FROM_QUERY_PARAM,
  useDefaultRedirectPath,
} from '@/lib/navigation-utils';

import { authenticationSession } from '../../lib/authentication-session';
import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';

export const TokenCheckerWrapper = (props: { children: JSX.Element }) => {
  const params = useParams();
  const projectIdFromParams = createMemo(() => params.projectId);

  const hasAccessToProject = createMemo(() =>
    isNil(projectIdFromParams())
      ? false
      : projectCollectionUtils.useHasAccessToProject(projectIdFromParams()),
  );

  createEffect(() => {
    const id = projectIdFromParams();
    if (isNil(id)) {
      window.location.replace('/sign-in');
      return;
    }
    if (!hasAccessToProject()) {
      toast.error(t('Invalid Access'), {
        description: t(
          'You tried to access a project that you do not have access to.',
        ),
        duration: 10000,
      });
      window.location.replace('/');
      return;
    }

    authenticationSession.switchToProject(id);
  });

  return <Show when={hasAccessToProject()}>{props.children}</Show>;
};

type RedirectToCurrentProjectRouteProps = {
  path: string;
  children: JSX.Element;
};

const RedirectToCurrentProjectRoute = (
  props: RedirectToCurrentProjectRouteProps,
) => {
  const currentProjectId = authenticationSession.getProjectId();
  const params = useParams();
  const defaultRedirectPath = useDefaultRedirectPath();
  const searchParams = new URLSearchParams(window.location.search);
  const from = searchParams.get(FROM_QUERY_PARAM) ?? defaultRedirectPath;
  const path = createMemo(
    () => `${props.path.startsWith('/') ? props.path : `/${props.path}`}`,
  );

  createEffect(() => {
    if (isNil(currentProjectId)) {
      if (window.location.pathname === '/sign-in') {
        return;
      }
      window.location.replace(
        `/sign-in?${new URLSearchParams({ from }).toString()}`,
      );
      return;
    }

    const pathWithParams = path().replace(
      /:(\w+)/g,
      (_, param: string) => params[param] ?? '',
    );
    const searchParamsString = searchParams.toString();
    const pathWithParamsAndSearchParams = `${pathWithParams}${
      searchParamsString ? `?${searchParamsString}` : ''
    }`;
    window.location.replace(
      `/projects/${currentProjectId}${pathWithParamsAndSearchParams}`,
    );
  });

  return null;
};

interface ProjectRouterWrapperProps {
  path: string;
  component: () => JSX.Element;
}

export const ProjectRouterWrapper = (opts: ProjectRouterWrapperProps) => [
  {
    path: `/projects/:projectId${
      opts.path.startsWith('/') ? opts.path : `/${opts.path}`
    }`,
    component: () => (
      <AllowOnlyLoggedInUserOnlyGuard>
        <TokenCheckerWrapper>
          <opts.component />
        </TokenCheckerWrapper>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
  {
    path: opts.path,
    component: () => (
      <AllowOnlyLoggedInUserOnlyGuard>
        <RedirectToCurrentProjectRoute path={opts.path}>
          <opts.component />
        </RedirectToCurrentProjectRoute>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
];
