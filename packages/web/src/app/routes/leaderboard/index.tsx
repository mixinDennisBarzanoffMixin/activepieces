import {
  AnalyticsTimePeriod,
  ColorName,
  UserWithBadges,
} from '@activepieces/shared';
import { createQuery } from '@tanstack/solid-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  Calendar,
  ChevronDown,
  Clock,
  Download,
  Info,
  LayoutGrid,
  RefreshCcw,
  Users,
  X,
} from 'lucide-solid';
import { useContext, createMemo, createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { userApi } from '@/api/user-api';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { PageHeader } from '@/components/custom/page-header';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  platformAnalyticsHooks,
  RefreshAnalyticsContext,
  RefreshAnalyticsProvider,
} from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { downloadFile } from '@/lib/dom-utils';
import { formatUtils } from '@/lib/format-utils';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { TimeSavedFilterContent } from '../impact/components/time-saved-filter-content';
import {
  convertToSeconds,
  TIME_UNITS,
  TimeUnit,
} from '../impact/lib/impact-utils';

import { ProjectsLeaderboard, ProjectStats } from './projects-leaderboard';
import { UsersLeaderboard, UserStats } from './users-leaderboard';

type TimeSavedFilter = {
  min: string;
  max: string;
  unitMin: TimeUnit;
  unitMax: TimeUnit;
};

const emptyFilter: TimeSavedFilter = {
  min: '',
  max: '',
  unitMin: 'Sec',
  unitMax: 'Sec',
};

function applyTimeSavedFilter<T extends { minutesSaved: number }>(
  data: T[],
  filter: TimeSavedFilter,
): T[] {
  let result = data;
  const minValue = filter.min ? parseFloat(filter.min) : null;
  const maxValue = filter.max ? parseFloat(filter.max) : null;
  if (minValue !== null) {
    result = result.filter(
      (p) => p.minutesSaved >= convertToSeconds(minValue, filter.unitMin),
    );
  }
  if (maxValue !== null) {
    result = result.filter(
      (p) => p.minutesSaved <= convertToSeconds(maxValue, filter.unitMax),
    );
  }
  return result;
}

export default function LeaderboardPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [timePeriod, setTimePeriod] = createSignal<AnalyticsTimePeriod>(
    AnalyticsTimePeriod.LAST_WEEK,
  );
  const { data: analyticsData, isLoading: isAnalyticsLoading } =
    platformAnalyticsHooks.useAnalytics();
  const { data: usersLeaderboardData, isLoading: isUsersLoading } =
    platformAnalyticsHooks.useUsersLeaderboard(timePeriod);
  const { data: projectsLeaderboardData, isLoading: isProjectsLoading } =
    platformAnalyticsHooks.useProjectLeaderboard(timePeriod);
  const { data: allProjects } = projectCollectionUtils.useAllPlatformProjects();

  const projectIconMap = createMemo(() => {
    const map = new Map<string, ColorName>();
    allProjects?.forEach((p) => {
      if (p.icon) {
        map.set(p.id, p.icon.color);
      }
    });
    return map;
  });
  const [activeTab, setActiveTab] = createSignal('creators');
  const [searchQuery, setSearchQuery] = createSignal('');

  const [peopleTimeSaved, setPeopleTimeSaved] =
    createSignal<TimeSavedFilter>(emptyFilter);
  const [projectsTimeSaved, setProjectsTimeSaved] =
    createSignal<TimeSavedFilter>(emptyFilter);

  const appliedFilter = createMemo(() =>
    activeTab() === 'creators' ? peopleTimeSaved() : projectsTimeSaved(),
  );
  const setAppliedFilter = (filter: TimeSavedFilter) => {
    if (activeTab() === 'creators') {
      setPeopleTimeSaved(filter);
      return;
    }
    setProjectsTimeSaved(filter);
  };

  const [draftTimeSavedMin, setDraftTimeSavedMin] = createSignal('');
  const [draftTimeSavedMax, setDraftTimeSavedMax] = createSignal('');
  const [draftTimeUnitMin, setDraftTimeUnitMin] = createSignal<TimeUnit>('Sec');
  const [draftTimeUnitMax, setDraftTimeUnitMax] = createSignal<TimeUnit>('Sec');
  const [timeSavedPopoverOpen, setTimeSavedPopoverOpen] = createSignal(false);

  const { mutate: refreshAnalytics } =
    platformAnalyticsHooks.useRefreshAnalytics();
  const { isRefreshing } = useContext(RefreshAnalyticsContext);

  const userIds = createMemo(
    () => usersLeaderboardData?.map((u) => u.userId) ?? [],
  );

  const { data: usersWithBadges } = createQuery(() => ({
    queryKey: ['user-badges', ...userIds()],
    queryFn: async () =>
      Promise.all(userIds().map((id) => userApi.getUserById(id))),
    staleTime: 5 * 60 * 1000,
    enabled: userIds().length > 0,
  }));

  const badgesMap = createMemo(() => {
    const map = new Map<string, UserWithBadges['badges']>();
    usersWithBadges?.forEach((user) => map.set(user.id, user.badges));
    return map;
  });

  const isLoading = isAnalyticsLoading || isUsersLoading || isProjectsLoading;

  const cycleDraftTimeUnitMin = () => {
    const idx = TIME_UNITS.indexOf(draftTimeUnitMin());
    setDraftTimeUnitMin(TIME_UNITS[(idx + 1) % TIME_UNITS.length]);
  };

  const cycleDraftTimeUnitMax = () => {
    const idx = TIME_UNITS.indexOf(draftTimeUnitMax());
    setDraftTimeUnitMax(TIME_UNITS[(idx + 1) % TIME_UNITS.length]);
  };

  const handleTimeSavedPopoverOpen = (open: boolean) => {
    if (open) {
      const filter = appliedFilter();
      setDraftTimeSavedMin(filter.min);
      setDraftTimeSavedMax(filter.max);
      setDraftTimeUnitMin(filter.unitMin);
      setDraftTimeUnitMax(filter.unitMax);
    }
    setTimeSavedPopoverOpen(open);
  };

  const handleApplyFilter = () => {
    setAppliedFilter({
      min: draftTimeSavedMin(),
      max: draftTimeSavedMax(),
      unitMin: draftTimeUnitMin(),
      unitMax: draftTimeUnitMax(),
    });
    setTimeSavedPopoverOpen(false);
  };

  const hasActiveFilters = createMemo(() => {
    const filter = appliedFilter();
    return searchQuery() !== '' || filter.min !== '' || filter.max !== '';
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setAppliedFilter(emptyFilter);
  };

  const timeSavedLabel = createMemo(() => {
    const filter = appliedFilter();
    if (!filter.min && !filter.max) return null;
    const min = filter.min ? `${filter.min} ${filter.unitMin}` : '0';
    const max = filter.max ? `${filter.max} ${filter.unitMax}` : '∞';
    return `${min} – ${max}`;
  });

  const peopleData = createMemo((): UserStats[] => {
    if (isLoading || !analyticsData?.users || !usersLeaderboardData) {
      return [];
    }

    const userMap = new Map(analyticsData.users.map((user) => [user.id, user]));

    return usersLeaderboardData
      .reduce<Omit<UserStats, 'rank'>[]>((acc, item) => {
        const user = userMap.get(item.userId);
        if (!user) return acc;

        acc.push({
          id: item.userId,
          visibleId: item.userId,
          userName: `${user.firstName} ${user.lastName}`.trim() || user.email,
          userEmail: user.email,
          flowCount: item.flowCount ?? 0,
          minutesSaved: item.minutesSaved ?? 0,
          badges: badgesMap().get(item.userId),
        });
        return acc;
      }, [])
      .sort((a, b) => b.minutesSaved - a.minutesSaved)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  });

  const projectsData = createMemo((): ProjectStats[] => {
    if (isLoading || !projectsLeaderboardData) {
      return [];
    }

    return projectsLeaderboardData
      .map((item) => ({
        id: item.projectId,
        projectId: item.projectId,
        projectName: item.projectName,
        flowCount: item.flowCount ?? 0,
        minutesSaved: item.minutesSaved ?? 0,
        iconColor: projectIconMap().get(item.projectId),
      }))
      .sort((a, b) => b.minutesSaved - a.minutesSaved)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  });

  const filteredPeopleData = createMemo(() => {
    let data = peopleData();
    if (searchQuery()) {
      const q = searchQuery().toLowerCase();
      data = data.filter(
        (p) =>
          p.userName.toLowerCase().includes(q) ||
          p.userEmail.toLowerCase().includes(q),
      );
    }
    return applyTimeSavedFilter(data, peopleTimeSaved());
  });

  const filteredProjectsData = createMemo(() => {
    let data = projectsData();
    if (searchQuery()) {
      const q = searchQuery().toLowerCase();
      data = data.filter((p) => p.projectName.toLowerCase().includes(q));
    }
    return applyTimeSavedFilter(data, projectsTimeSaved());
  });

  const handleDownload = () => {
    if (activeTab() === 'creators') {
      if (filteredPeopleData().length === 0) return;

      const csvHeader = 'Name,Email,Flows,Time Saved\n';
      const csvContent = filteredPeopleData()
        .map(
          (person) =>
            `"${person.userName}","${person.userEmail}",${
              person.flowCount
            },"${formatUtils.formatToHoursAndMinutes(
              person.minutesSaved || 0,
            )}"`,
        )
        .join('\n');

      void downloadFile({
        obj: csvHeader + csvContent,
        fileName: 'people-leaderboard',
        extension: 'csv',
      });
    } else {
      if (filteredProjectsData().length === 0) return;

      const csvHeader = 'Project,Flows,Time Saved\n';
      const csvContent = filteredProjectsData()
        .map(
          (project) =>
            `"${project.projectName}",${
              project.flowCount
            },"${formatUtils.formatToHoursAndMinutes(
              project.minutesSaved || 0,
            )}"`,
        )
        .join('\n');

      void downloadFile({
        obj: csvHeader + csvContent,
        fileName: 'projects-leaderboard',
        extension: 'csv',
      });
    }
  };

  const isDownloadDisabled = createMemo(
    () =>
      isLoading ||
      (activeTab() === 'creators' && filteredPeopleData().length === 0) ||
      (activeTab() === 'projects' && filteredProjectsData().length === 0),
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  return (
    <LockedFeatureGuard
      featureKey="ANALYTICS"
      locked={!platform.plan.analyticsEnabled}
      lockTitle={t('Unlock Leaderboard')}
      lockDescription={t(
        'See top performers by flows created and time saved across your platform',
      )}
    >
      <RefreshAnalyticsProvider>
        <div class="flex flex-col gap-2 w-full">
          <PageHeader
            showSidebarToggle={true}
            title={
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium">{t('Leaderboard')}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info class="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('See top performers by flows created and time saved')}
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            rightContent={
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-md text-sm text-muted-foreground">
                  <span>
                    {t('Updated')}{' '}
                    {dayjs(analyticsData?.cachedAt).format('MMM DD, hh:mm A')}
                    {' — '}
                    {t('Refreshes daily')}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6"
                        onClick={() =>
                          refreshAnalytics(undefined, {
                            onSuccess: () =>
                              toast.success(t('Data refreshed successfully')),
                          })
                        }
                        disabled={isRefreshing}
                      >
                        <RefreshCcw
                          class={`h-3.5 w-3.5 ${
                            isRefreshing ? 'animate-spin' : ''
                          }`}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('Refresh analytics')}</TooltipContent>
                  </Tooltip>
                </div>

                <Select
                  value={timePeriod()}
                  onValueChange={(value) =>
                    setTimePeriod(value as AnalyticsTimePeriod)
                  }
                >
                  <SelectTrigger class="w-auto gap-2 h-8">
                    <Calendar class="h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="end">
                    <SelectItem value={AnalyticsTimePeriod.LAST_WEEK}>
                      {t('Last 7 days')}
                    </SelectItem>
                    <SelectItem value={AnalyticsTimePeriod.LAST_MONTH}>
                      {t('Last 30 days')}
                    </SelectItem>
                    <SelectItem value={AnalyticsTimePeriod.LAST_THREE_MONTHS}>
                      {t('Last 3 months')}
                    </SelectItem>
                    <SelectItem value={AnalyticsTimePeriod.LAST_SIX_MONTHS}>
                      {t('Last 6 months')}
                    </SelectItem>
                    <SelectItem value={AnalyticsTimePeriod.LAST_YEAR}>
                      {t('Last year')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            class="min-w-full"
          />

          <Tabs
            defaultValue="creators"
            class="w-full mt-2"
            onValueChange={handleTabChange}
          >
            <TabsList
              variant="outline"
              class={cn('border-b w-full', DASHBOARD_CONTENT_PADDING_X)}
            >
              <TabsTrigger variant="outline" value="creators">
                <Users class="w-4 h-4 mr-1.5" />
                {t('People')}
              </TabsTrigger>
              <TabsTrigger variant="outline" value="projects">
                <LayoutGrid class="w-4 h-4 mr-1.5" />
                {t('Projects')}
              </TabsTrigger>
            </TabsList>

            <div
              class={cn(
                'flex items-center justify-between mt-4 mb-4',
                DASHBOARD_CONTENT_PADDING_X,
              )}
            >
              <div class="flex items-center gap-2">
                <SearchInput
                  value={searchQuery()}
                  onChange={setSearchQuery}
                  placeholder={
                    activeTab() === 'creators'
                      ? `${t('Search users')}`
                      : `${t('Search projects')}`
                  }
                  class="w-[200px]"
                />
                <Popover
                  open={timeSavedPopoverOpen()}
                  onOpenChange={handleTimeSavedPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      class="gap-2 font-normal border-dashed"
                    >
                      <Clock class="h-4 w-4" />
                      <span>{t('Time Saved')}</span>
                      <Show when={timeSavedLabel()}>
                        <span class="rounded bg-accent px-1.5 py-0.5 text-xs font-medium">
                          {timeSavedLabel()}
                        </span>
                      </Show>
                      <ChevronDown class="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-[200px] p-4" align="start">
                    <TimeSavedFilterContent
                      draftMin={draftTimeSavedMin()}
                      onMinChange={setDraftTimeSavedMin}
                      unitMin={draftTimeUnitMin()}
                      onCycleUnitMin={cycleDraftTimeUnitMin}
                      draftMax={draftTimeSavedMax()}
                      onMaxChange={setDraftTimeSavedMax}
                      unitMax={draftTimeUnitMax()}
                      onCycleUnitMax={cycleDraftTimeUnitMax}
                      onApply={handleApplyFilter}
                    />
                  </PopoverContent>
                </Popover>
                <Show when={hasActiveFilters()}>
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X class="h-4 w-4" />
                    {t('Clear')}
                  </Button>
                </Show>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloadDisabled()}
                  >
                    <Download class="h-4 w-4 mr-2" />
                    {t('Download')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('Download leaderboard data')}
                </TooltipContent>
              </Tooltip>
            </div>

            <TabsContent value="creators">
              <UsersLeaderboard
                data={filteredPeopleData()}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="projects">
              <ProjectsLeaderboard
                data={filteredProjectsData()}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </RefreshAnalyticsProvider>
    </LockedFeatureGuard>
  );
}
