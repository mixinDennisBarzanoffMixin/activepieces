import { Router, Route } from '@solidjs/router';
import { Suspense, lazy, For, type JSX } from 'solid-js';

import { PageTitle } from '@/app/components/page-title';
import { authRoutes } from '@/app/routes/auth-routes';
import { platformRoutes } from '@/app/routes/platform-routes';
import { projectRoutes } from '@/app/routes/project-routes';
import { publicRoutes } from '@/app/routes/public-routes';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';

import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';
import { ProjectDashboardLayout } from '../components/project-layout';

import { DefaultRoute } from './default-route';
import { TokenCheckerWrapper } from './project-route-wrapper';

const ChatWithAIPage = lazy(() =>
  import('@/app/routes/chat-with-ai').then((m) => ({
    default: m.ChatWithAIPage,
  })),
);

function chatElement() {
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <ProjectDashboardLayout>
        <PageTitle title="Chat">
          <Suspense fallback={<RouteLoadingBar />}>
            <ChatWithAIPage />
          </Suspense>
        </PageTitle>
      </ProjectDashboardLayout>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}

const chatRoutes = [
  { path: '/chat', component: chatElement },
  { path: '/chat/:conversationId', component: chatElement },
];

const routes = [
  ...publicRoutes,
  ...projectRoutes,
  ...authRoutes,
  ...platformRoutes,
  ...chatRoutes,
  {
    path: '/projects/:projectId',
    component: () => (
      <TokenCheckerWrapper>
        <DefaultRoute />
      </TokenCheckerWrapper>
    ),
  },
  {
    path: '/*',
    component: () => (
      <PageTitle title="Redirect">
        <DefaultRoute />
      </PageTitle>
    ),
  },
];

function routeComponent(route: AppRoute) {
  if (route.component) {
    return route.component;
  }
  return () => route.element ?? null;
}

const memoryRouter = {
  state: {
    location: {
      pathname: window.location.pathname,
      search: window.location.search,
    },
  },
  navigate(path: string) {
    window.history.pushState(null, '', path);
    this.state.location.pathname = window.location.pathname;
    this.state.location.search = window.location.search;
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
  subscribe(listener: (state: typeof memoryRouter.state) => void) {
    const handle = () => listener(this.state);
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  },
};

const ApRouter = () => {
  const { embedState } = useEmbedding();
  const source = embedState.isEmbedded ? 'memory' : 'url';
  return (
    <Router source={source}>
      <For each={routes}>
        {(route) => <Route path={route.path} component={routeComponent(route)} />}
      </For>
    </Router>
  );
};

export { ApRouter, memoryRouter };

type AppRoute = {
  path: string;
  component?: () => JSX.Element;
  element?: JSX.Element;
};
