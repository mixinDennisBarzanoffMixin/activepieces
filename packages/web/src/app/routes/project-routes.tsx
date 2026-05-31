import { Permission } from '@activepieces/shared';
import { Suspense, lazy } from 'solid-js';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { ApTableStateProvider } from '@/features/tables';
import { routesThatRequireProjectId } from '@/lib/route-utils';

import { BuilderLayout } from '../components/builder-layout';
import { ProjectDashboardLayout } from '../components/project-layout';
import { AfterImportFlowRedirect } from '../guards/after-import-flow-redirect';
import { RoutePermissionGuard } from '../guards/permission-guard';
import { ProjectRouterWrapper } from '../guards/project-route-wrapper';

import { AutomationsPage } from './automations';
const FlowBuilderPage = lazy(() =>
  import('./flows/id').then((m) => ({ default: m.FlowBuilderPage })),
);
const AnalyticsPage = lazy(() => import('./impact'));
const LeaderboardPage = lazy(() => import('./leaderboard'));
const ProjectReleasesPage = lazy(() =>
  import('./project-release').then((m) => ({
    default: m.ProjectReleasesPage,
  })),
);
const ViewRelease = lazy(() => import('./project-release/view-release'));
const RunsPage = lazy(() =>
  import('./runs').then((m) => ({ default: m.RunsPage })),
);
const FlowRunPage = lazy(() =>
  import('./runs/id').then((m) => ({ default: m.FlowRunPage })),
);
const AppConnectionsPage = lazy(() =>
  import('./connections').then((m) => ({ default: m.AppConnectionsPage })),
);
const VariablesPage = lazy(() =>
  import('./variables').then((m) => ({ default: m.VariablesPage })),
);
const ApTableEditorPage = lazy(() =>
  import('./tables/id').then((m) => ({ default: m.ApTableEditorPage })),
);

const SettingsRerouter = () => {
  const fragmentWithoutHash = window.location.hash.slice(1).toLowerCase();
  window.location.replace(
    fragmentWithoutHash ? `/settings/${fragmentWithoutHash}` : '/settings/team',
  );
  return null;
};

function SuspenseWrapper({ children }: { children: JSX.Element }) {
  return <Suspense fallback={<RouteLoadingBar />}>{children}</Suspense>;
}

function Redirect({ to }: { to: string }) {
  window.location.replace(to);
  return null;
}

function HideTablesGuard({ children }: { children: JSX.Element }) {
  const { embedState } = useEmbedding();
  if (embedState.hideTables) {
    return <Redirect to={routesThatRequireProjectId.automations} />;
  }
  return <>{children}</>;
}

const automationsPagePermissions = [
  Permission.READ_FLOW,
  Permission.READ_TABLE,
  Permission.READ_FOLDER,
];

export const projectRoutes = [
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.automations,
    component: () => (
      <ProjectDashboardLayout>
        <RoutePermissionGuard requiredPermissions={automationsPagePermissions}>
          <PageTitle title="Flows">
            <SuspenseWrapper>
              <AutomationsPage />
            </SuspenseWrapper>
          </PageTitle>
        </RoutePermissionGuard>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.flows,
    component: () => <Redirect to={routesThatRequireProjectId.automations} />,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleFlow,
    component: () => (
      <RoutePermissionGuard requiredPermissions={Permission.READ_FLOW}>
        <PageTitle title="Builder">
          <BuilderLayout>
            <SuspenseWrapper>
              <FlowBuilderPage />
            </SuspenseWrapper>
          </BuilderLayout>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flow-import-redirect/:flowId',
    component: () => <AfterImportFlowRedirect></AfterImportFlowRedirect>,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleRun,
    component: () => (
      <RoutePermissionGuard requiredPermissions={Permission.READ_RUN}>
        <PageTitle title="Flow Run">
          <BuilderLayout>
            <SuspenseWrapper>
              <FlowRunPage />
            </SuspenseWrapper>
          </BuilderLayout>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.runs,
    component: () => (
      <ProjectDashboardLayout>
        <RoutePermissionGuard requiredPermissions={Permission.READ_RUN}>
          <PageTitle title="Runs">
            <SuspenseWrapper>
              <RunsPage />
            </SuspenseWrapper>
          </PageTitle>
        </RoutePermissionGuard>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleRelease,
    component: () => (
      <ProjectDashboardLayout>
        <PageTitle title="Releases">
          <SuspenseWrapper>
            <ViewRelease />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.tables,
    component: () => <Redirect to={routesThatRequireProjectId.automations} />,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleTable,
    component: () => (
      <HideTablesGuard>
        <RoutePermissionGuard requiredPermissions={Permission.READ_TABLE}>
          <PageTitle title="Table">
            <BuilderLayout>
              <ApTableStateProvider>
                <SuspenseWrapper>
                  <ApTableEditorPage />
                </SuspenseWrapper>
              </ApTableStateProvider>
            </BuilderLayout>
          </PageTitle>
        </RoutePermissionGuard>
      </HideTablesGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.connections,
    component: () => (
      <ProjectDashboardLayout>
        <RoutePermissionGuard
          requiredPermissions={Permission.READ_APP_CONNECTION}
        >
          <PageTitle title="Connections">
            <SuspenseWrapper>
              <AppConnectionsPage />
            </SuspenseWrapper>
          </PageTitle>
        </RoutePermissionGuard>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.variables,
    component: () => (
      <ProjectDashboardLayout>
        <RoutePermissionGuard requiredPermissions={Permission.READ_VARIABLE}>
          <PageTitle title="Variables">
            <SuspenseWrapper>
              <VariablesPage />
            </SuspenseWrapper>
          </PageTitle>
        </RoutePermissionGuard>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.releases,
    component: () => (
      <ProjectDashboardLayout>
        <PageTitle title="Releases">
          <SuspenseWrapper>
            <ProjectReleasesPage />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.settings,
    component: () => (
      <ProjectDashboardLayout>
        <SettingsRerouter></SettingsRerouter>
      </ProjectDashboardLayout>
    ),
  }),
  {
    path: '/impact',
    component: () => (
      <ProjectDashboardLayout>
        <PageTitle title="Impact">
          <SuspenseWrapper>
            <AnalyticsPage />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  },
  {
    path: '/leaderboard',
    component: () => (
      <ProjectDashboardLayout>
        <PageTitle title="Leaderboard">
          <SuspenseWrapper>
            <LeaderboardPage />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  },
];
