import { Suspense, lazy } from 'solid-js';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';

import { ProjectDashboardLayout } from '../components/project-layout';
import { TemplateDetailsWrapper } from '../guards/template-details-wrapper';

import NotFoundPage from './404-page';
import AuthenticatePage from './authenticate';
import { EmbedPage } from './embed';
import { EmbeddedConnectionDialog } from './embed/embedded-connection-dialog';
import { McpAuthorizePage } from './mcp-authorize';
import { RedirectPage } from './redirect';

const ChatPage = lazy(() =>
  import('./chat').then((m) => ({ default: m.ChatPage })),
);
const FormPage = lazy(() =>
  import('./forms').then((m) => ({ default: m.FormPage })),
);
const TemplatesPage = lazy(() =>
  import('./templates').then((m) => ({ default: m.TemplatesPage })),
);

function SuspenseWrapper({ children }: { children: JSX.Element }) {
  return <Suspense fallback={<RouteLoadingBar />}>{children}</Suspense>;
}

export const publicRoutes = [
  {
    path: '/embed',
    component: () => <EmbedPage></EmbedPage>,
  },
  {
    path: '/embed/connections',
    component: () => <EmbeddedConnectionDialog></EmbeddedConnectionDialog>,
  },
  {
    path: '/authenticate',
    component: () => <AuthenticatePage />,
  },
  {
    path: '/templates',
    component: () => (
      <ProjectDashboardLayout>
        <PageTitle title="Templates">
          <SuspenseWrapper>
            <TemplatesPage />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  },
  {
    path: '/templates/:templateId',
    component: () => <TemplateDetailsWrapper />,
  },
  {
    path: '/forms/:flowId',
    component: () => (
      <PageTitle title="Forms">
        <SuspenseWrapper>
          <FormPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/chats/:flowId',
    component: () => (
      <PageTitle title="Chats">
        <SuspenseWrapper>
          <ChatPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/mcp-authorize',
    component: () => (
      <PageTitle title="Authorize">
        <McpAuthorizePage />
      </PageTitle>
    ),
  },
  {
    path: '/redirect',
    component: () => <RedirectPage></RedirectPage>,
  },
  {
    path: '/404',
    component: () => (
      <PageTitle title="Not Found">
        <NotFoundPage />
      </PageTitle>
    ),
  },
];
