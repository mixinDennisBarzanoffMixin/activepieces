import {
  isNil,
  PROJECT_COLOR_PALETTE,
  PlatformRole,
  ProjectType,
  TeamProjectsLimit,
  TemplateTelemetryEventType,
} from '@activepieces/shared';
import { useLocation, useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import { Search } from 'lucide-solid';
import { createEffect, createMemo, createSignal, Show, For } from 'solid-js';

import { SearchInput } from '@/components/custom/search-input';
import { ChartLineIcon } from '@/components/icons/chart-line';
import { CompassIcon } from '@/components/icons/compass';
import { SendIcon } from '@/components/icons/send';
import { ShieldIcon } from '@/components/icons/shield';
import { TrophyIcon } from '@/components/icons/trophy';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarSeparator,
  useSidebar,
  SidebarGroupLabel,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import {
  CreateProjectButton,
  projectCollectionUtils,
  getProjectName,
} from '@/features/projects';
import { templatesTelemetryApi } from '@/features/templates';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { useDebounce } from '@/lib/debounce';
import { cn } from '@/lib/utils';

import { recordAccess } from '../../global-search/access-history';
import { GlobalSearchCommand } from '../../global-search/global-search-command';
import { STATIC_PAGES } from '../../global-search/static-pages';
import { SidebarGeneralItemType } from '../ap-sidebar-group';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import ProjectSideBarItem from '../project';
import { AppSidebarHeader } from '../sidebar-header';
import SidebarUsageLimits from '../sidebar-usage-limits';
import { SidebarUser } from '../sidebar-user';

export function ProjectDashboardSidebar(props: { className?: string } = {}) {
  const { data: projects } = projectCollectionUtils.useAll();
  const { embedState } = useEmbedding();
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = createSignal('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [searchOpen, setSearchOpen] = createSignal(false);
  const { data: currentUser } = userHooks.useCurrentUser();
  const { platform } = platformHooks.useCurrentPlatform();
  createEffect(() => {
    if (!searchOpen()) {
      setSearchQuery('');
    }
  });

  const shouldShowNewProjectButton = createMemo(() => {
    if (platform.plan.teamProjectsLimit === TeamProjectsLimit.NONE) {
      return false;
    }
    return currentUser?.platformRole === PlatformRole.ADMIN;
  });

  const shouldShowSearchButton = createMemo(() => {
    if (platform.plan.teamProjectsLimit === TeamProjectsLimit.NONE) {
      return false;
    }
    return true;
  });

  const shouldShowInlineAddButton =
    platform.plan.teamProjectsLimit !== TeamProjectsLimit.NONE &&
    currentUser?.platformRole === PlatformRole.ADMIN &&
    projects.filter((project) => project.type === ProjectType.TEAM).length ===
      0;

  const isSearchMode = () => debouncedSearchQuery().length > 0;

  const displayProjects = createMemo(() => {
    if (isSearchMode()) {
      const query = debouncedSearchQuery().toLowerCase();
      return projects.filter((project) =>
        project.displayName.toLowerCase().includes(query),
      );
    }
    return projects;
  });
  const handleProjectSelect = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      const palette = project.icon
        ? PROJECT_COLOR_PALETTE[project.icon.color]
        : null;
      const name = getProjectName(project);
      recordAccess({
        id: `project-${projectId}`,
        type: 'project',
        label: name,
        href: `/projects/${projectId}/automations`,
        iconBgColor: palette?.color,
        iconTextColor: palette?.textColor,
        iconLetter: name.charAt(0).toUpperCase(),
      });
    }
    projectCollectionUtils.setCurrentProject(projectId);
    setSearchOpen(false);
    window.location.href = `/projects/${projectId}/automations`;
  };

  const permissionFilter = (link: SidebarGeneralItemType) => {
    if (link.type === 'link') {
      return isNil(link.hasPermission) || link.hasPermission;
    }
    return true;
  };
  const handleExploreClick = () => {
    void templatesTelemetryApi.sendEvent({
      eventType: TemplateTelemetryEventType.EXPLORE_VIEW,
      userId: currentUser?.id,
    });
  };

  const chatLink: SidebarItemType = {
    type: 'link',
    to: '/chat',
    label: t('Chat'),
    show: platform.plan.chatEnabled,
    icon: SendIcon,
    hasPermission: true,
    isSubItem: false,
    badge: t('Beta'),
  };

  const exploreLink: SidebarItemType = {
    type: 'link',
    to: '/templates',
    label: t('Explore'),
    show: true,
    icon: CompassIcon,
    hasPermission: true,
    isSubItem: false,
    onClick: () => {
      handleExploreClick();
      const page = STATIC_PAGES.find((p) => p.href === '/templates');
      if (page)
        recordAccess({
          id: page.id,
          type: 'page',
          label: page.label,
          href: page.href,
        });
    },
  };

  const impactLink: SidebarItemType = {
    type: 'link',
    to: '/impact',
    label: t('Impact'),
    icon: ChartLineIcon,
    show: true,
    hasPermission: true,
    isSubItem: false,
    onClick: () => {
      const page = STATIC_PAGES.find((p) => p.href === '/impact');
      if (page)
        recordAccess({
          id: page.id,
          type: 'page',
          label: page.label,
          href: page.href,
        });
    },
  };

  const leaderboardLink: SidebarItemType = {
    type: 'link',
    to: '/leaderboard',
    label: t('Leaderboard'),
    icon: TrophyIcon,
    show: true,
    hasPermission: true,
    isSubItem: false,
    onClick: () => {
      const page = STATIC_PAGES.find((p) => p.href === '/leaderboard');
      if (page)
        recordAccess({
          id: page.id,
          type: 'page',
          label: page.label,
          href: page.href,
        });
    },
  };

  const items = [chatLink, exploreLink, impactLink, leaderboardLink]
    .filter((item) => item.show !== false)
    .filter(permissionFilter);

  return (
    <Show when={!embedState.hideSideNav}>
      <Sidebar
        collapsible="icon"
        id={SIDEBAR_ID}
        class={cn('max-h-[100vh]', props.className)}
      >
        <AppSidebarHeader />

        <SidebarContent class="overflow-x-hidden">
          <SidebarGroup>
            <div class="mb-1 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <GlobalSearchCommand />
            </div>
            <SidebarMenu>
              {<For each={items}>{(item) => <ApSidebarItem {...item} />}</For>}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup class="flex-1 overflow-hidden">
            <div class="flex items-center justify-between group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel>{t('Projects')}</SidebarGroupLabel>
              <div class="flex items-center justify-center gap-2">
                {
                  <Show when={shouldShowNewProjectButton()}>
                    <CreateProjectButton
                      variant="icon"
                      projects={projects ?? []}
                      onCreate={(project) => {
                        void navigate(`/projects/${project.id}/flows`);
                      }}
                    />
                  </Show>
                }
                {
                  <Show when={shouldShowSearchButton()}>
                    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-6 w-6 hover:bg-accent"
                        >
                          <Search />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        class="w-[280px] p-3"
                        align="start"
                        side="right"
                        sideOffset={8}
                      >
                        <SearchInput
                          placeholder={String(t('Search projects...'))}
                          value={searchQuery}
                          onChange={(value: string) => setSearchQuery(value)}
                          class="h-8"
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </Show>
                }
              </div>
            </div>
            <div
              class="flex-1 grow min-h-0 flex flex-col overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div class="flex max-h-[100%]">
                {
                  <Show
                    when={displayProjects().length > 0}
                    fallback={
                      <Show when={isSearchMode()}>
                        <div class="px-2 py-2 text-sm text-muted-foreground">
                          {state === 'expanded' && t('No projects found.')}
                        </div>
                      </Show>
                    }
                  >
                    <VirtualizedScrollArea
                      class={cn(
                        'flex-1',
                        state === 'collapsed'
                          ? 'flex flex-col items-center scrollbar-none'
                          : '',
                      )}
                      items={displayProjects()}
                      estimateSize={() => 35}
                      getItemKey={(index) =>
                        displayProjects()[index]?.id ?? index
                      }
                      overscan={10}
                      renderItem={(project) => (
                        <SidebarMenuItem class="w-full">
                          <ProjectSideBarItem
                            key={project.id}
                            project={project}
                            isCurrentProject={location.pathname.includes(
                              `/projects/${project.id}`,
                            )}
                            handleProjectSelect={handleProjectSelect}
                          />
                        </SidebarMenuItem>
                      )}
                    />
                  </Show>
                }
              </div>
              {
                <Show when={shouldShowInlineAddButton && state === 'expanded'}>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <CreateProjectButton
                        variant="sidebar-menu"
                        projects={projects ?? []}
                        onCreate={(project) => {
                          void navigate(`/projects/${project.id}/flows`);
                        }}
                      />
                    </SidebarMenuItem>
                  </SidebarMenu>
                </Show>
              }
            </div>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {
            <Show when={state === 'expanded'}>
              <DelayedSidebarUsageLimits />
            </Show>
          }
          <SidebarPlatformAdminLink />
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    </Show>
  );
}

function DelayedSidebarUsageLimits() {
  const [show, setShow] = createSignal(false);

  createEffect(() => {
    const timer = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(timer);
  });

  return (
    <Show when={show}>
      <div>
        <SidebarUsageLimits />
      </div>
    </Show>
  );
}

function SidebarPlatformAdminLink() {
  const showPlatformAdmin = useIsPlatformAdmin();
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded || !showPlatformAdmin) {
    return null;
  }

  return (
    <SidebarMenu>
      <ApSidebarItem
        type="link"
        to="/platform/projects"
        label={t('Platform Admin')}
        icon={ShieldIcon}
        isSubItem={false}
        show={true}
        hasPermission={true}
        onClick={() => {
          const page = STATIC_PAGES.find(
            (p) =>
              p.href === '/platform/projects' && p.id === 'page-platform-admin',
          );
          if (page)
            recordAccess({
              id: page.id,
              type: 'page',
              label: page.label,
              href: page.href,
            });
        }}
      />
    </SidebarMenu>
  );
}

export const SIDEBAR_ID = 'project-sidebar';
