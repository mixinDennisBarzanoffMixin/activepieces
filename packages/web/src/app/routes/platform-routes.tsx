import { PageTitle } from '@/app/components/page-title';
import { Error, Success } from '@/features/billing';

import { PlatformLayout } from '../components/platform-layout';

import SettingsBilling from './platform/billing';
import PlatformConnectionsPage from './platform/connections';
import EventDestinationsPage from './platform/infra/event-destinations';
import SettingsHealthPage from './platform/infra/health';
import TriggerHealthPage from './platform/infra/triggers';
import SettingsWorkersPage from './platform/infra/workers';
import ProjectsPage from './platform/projects';
import { ApiKeysPage } from './platform/security/api-keys';
import AuditLogsPage from './platform/security/audit-logs';
import { EmbedPage } from './platform/security/embed';
import { ProjectRolePage } from './platform/security/project-role';
import SecretManagersPage from './platform/security/secret-managers';
import { SSOPage } from './platform/security/sso';
import AIProvidersPage from './platform/setup/ai';
import { BrandingPage } from './platform/setup/branding';
import { GlobalConnectionsTable } from './platform/setup/connections';
import PlatformMcpPage from './platform/setup/mcp';
import { PlatformPiecesPage } from './platform/setup/pieces';
import { PlatformTemplatesPage } from './platform/setup/templates';
import UsersPage from './platform/users';

function Redirect({ to }: { to: string }) {
  window.location.replace(to);
  return null;
}

export const platformRoutes = [
  {
    path: '/platform',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Platform">
          <Redirect to="/platform/projects" />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/projects',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Projects">
          <ProjectsPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/users',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Users">
          <UsersPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/connections',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Connections">
          <PlatformConnectionsPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Platform Setup">
          <Redirect to="/platform/setup/ai" />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/ai',
    component: () => (
      <PlatformLayout>
        <PageTitle title="AI">
          <AIProvidersPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/mcp',
    component: () => (
      <PlatformLayout>
        <PageTitle title="MCP Server">
          <PlatformMcpPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/pieces',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Pieces">
          <PlatformPiecesPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/connections',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Connections">
          <GlobalConnectionsTable />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/templates',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Templates">
          <PlatformTemplatesPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/branding',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Branding">
          <BrandingPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/billing',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Billing">
          <SettingsBilling />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/billing/success',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Billing">
          <Success />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/billing/error',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Billing">
          <Error />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Platform Security">
          <Redirect to="/platform/security/audit-logs" />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/api-keys',
    component: () => (
      <PlatformLayout>
        <PageTitle title="API Keys">
          <ApiKeysPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/secret-managers',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Secret managers">
          <SecretManagersPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/audit-logs',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Audit Logs">
          <AuditLogsPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/embed',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Embedding">
          <EmbedPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/sso',
    component: () => (
      <PlatformLayout>
        <PageTitle title="SSO">
          <SSOPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/project-roles',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Project Roles">
          <ProjectRolePage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Platform Infrastructure">
          <Redirect to="/platform/infrastructure/workers" />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/workers',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Workers">
          <SettingsWorkersPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/health',
    component: () => (
      <PlatformLayout>
        <PageTitle title="System Health">
          <SettingsHealthPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/triggers',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Trigger Health">
          <TriggerHealthPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/event-destinations',
    component: () => (
      <PlatformLayout>
        <PageTitle title="Event Streaming">
          <EventDestinationsPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
];
