import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Show, type Component, type JSX } from 'solid-js';

import { ChartLineIcon } from '@/components/icons/chart-line';
import { CompassIcon } from '@/components/icons/compass';
import { TrophyIcon } from '@/components/icons/trophy';
import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing';
import { projectHooks } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { authenticationSession } from '../../../lib/authentication-session';
import {
  GlobalSearchProvider,
  useGlobalSearch,
} from '../global-search/global-search-context';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';

import { ProjectDashboardLayoutHeader } from './project-dashboard-layout-header';

export type ProjectDashboardLayoutHeaderTab = {
  to: string;
  label: string;
  icon: Component<{ class?: string }>;
  hasPermission: boolean;
  show: boolean;
  beta?: boolean;
};

const ProjectChangedRedirector = (props: {
  currentProjectId: string;
  children: JSX.Element;
}) => {
  projectHooks.useReloadPageIfProjectIdChanged(props.currentProjectId);
  return <>{props.children}</>;
};

export function ProjectDashboardLayout(props: { children: JSX.Element }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const currentProjectId = authenticationSession.getProjectId();
  const isPlatformPage = window.location.pathname.includes('/platform/');
  const isEmbedded = useEmbedding().embedState.isEmbedded;
  if (isNil(currentProjectId) || currentProjectId === '') {
    window.location.replace('/sign-in');
    return null;
  }

  const itemsWithoutHeader: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: '/templates',
      label: t('Explore'),
      show: !isEmbedded,
      icon: CompassIcon,
      hasPermission: true,
    },
    {
      to: '/impact',
      label: t('Impact'),
      show: !isEmbedded,
      icon: ChartLineIcon,
      hasPermission: true,
    },
    {
      to: '/leaderboard',
      label: t('Leaderboard'),
      show: !isEmbedded,
      icon: TrophyIcon,
      hasPermission: true,
    },
    {
      to: '/chat',
      label: t('Chat'),
      show: !isEmbedded,
      icon: CompassIcon,
      hasPermission: true,
    },
  ];

  const hideHeader =
    itemsWithoutHeader.some((item) => location.pathname.includes(item.to)) ||
    isPlatformPage;

  return (
    <ProjectChangedRedirector currentProjectId={currentProjectId}>
      <GlobalSearchProvider>
        <ProjectDashboardLayoutInner
          hideHeader={hideHeader}
          isEmbedded={isEmbedded}
          currentProjectId={currentProjectId}
        >
          {props.children}
        </ProjectDashboardLayoutInner>
        {
          <Show when={edition === ApEdition.CLOUD}>
            <PurchaseExtraFlowsDialog />
          </Show>
        }
      </GlobalSearchProvider>
    </ProjectChangedRedirector>
  );
}

function ProjectDashboardLayoutInner(props: {
  hideHeader: boolean;
  isEmbedded: boolean;
  currentProjectId: string;
  children: JSX.Element;
}) {
  const { open: searchOpen } = useGlobalSearch();

  return (
    <SidebarProvider hoverMode={!searchOpen}>
      {
        <Show when={!props.isEmbedded}>
          <ProjectDashboardSidebar />
        </Show>
      }
      <SidebarInset class="flex flex-col h-full overflow-hidden bg-sidebar">
        <div
          class={cn(
            'flex-1 flex flex-col overflow-hidden',
            !props.isEmbedded && 'pr-2 pt-3 pb-3',
          )}
        >
          <div
            id="dashboard-content-container"
            class={cn(
              'relative flex flex-col h-full bg-background overflow-clip',
              !props.isEmbedded &&
                'rounded-xl shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border',
            )}
          >
            {
              <Show when={!props.hideHeader}>
                <ProjectDashboardLayoutHeader key={props.currentProjectId} />
              </Show>
            }
            <div class="flex-1 overflow-auto">{props.children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
