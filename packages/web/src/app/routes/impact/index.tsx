import { AnalyticsTimePeriod } from '@activepieces/shared';
import { useSearchParams } from '@solidjs/router';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Calendar, Info, LineChart, List, RefreshCcw } from 'lucide-solid';
import { createEffect, useContext } from 'solid-js';
import { toast } from 'solid-sonner';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { PageHeader } from '@/components/custom/page-header';
import { Button } from '@/components/ui/button';
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
} from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { ProjectSelect } from './components/project-select';
import { FlowsDetails } from './details';
import { Summary } from './summary';
import { Trends } from './trends';

const REPORT_TTL_MS = 1000 * 60 * 60 * 24;

type TabValue = 'analytics' | 'details';

export default function ImpactPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.projectId || undefined;
  const selectedTimePeriod = parseTimePeriod(searchParams.timePeriod);
  const activeTab = parseTab(searchParams.tab);

  const { data: projects } = projectCollectionUtils.useAll();
  const { data, isLoading } = platformAnalyticsHooks.useAnalyticsTimeBased(
    selectedTimePeriod,
    selectedProjectId,
  );

  const { mutate: refreshAnalytics } =
    platformAnalyticsHooks.useRefreshAnalytics();
  const { isRefreshing } = useContext(RefreshAnalyticsContext);

  const handleProjectChange = (projectId: string) => {
    if (projectId === 'all') {
      setSearchParams({ projectId: undefined }, { replace: true });
      return;
    }
    setSearchParams({ projectId }, { replace: true });
  };

  const handleTimePeriodChange = (timePeriod: string) => {
    setSearchParams({ timePeriod }, { replace: true });
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'analytics') {
      setSearchParams({ tab: undefined }, { replace: true });
      return;
    }
    setSearchParams({ tab }, { replace: true });
  };

  createEffect(() => {
    const hasAnalyticsExpired = dayjs(data?.updated)
      .add(REPORT_TTL_MS, 'ms')
      .isBefore(dayjs());
    if (hasAnalyticsExpired && !isRefreshing) {
      refreshAnalytics();
    }
  });

  const report = isLoading ? undefined : data ?? undefined;

  return (
    <LockedFeatureGuard
      featureKey="ANALYTICS"
      locked={!platform.plan.analyticsEnabled}
      lockTitle={t('Unlock Impact Analytics')}
      lockDescription={t(
        'View impact analytics and metrics for the active flows across your platform',
      )}
    >
      <div class="flex flex-col gap-4 w-full">
        <PageHeader
          showSidebarToggle={true}
          title={
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-medium">{t('Impact')}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info class="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  {t('View impact analytics and metrics for the active flows.')}
                </TooltipContent>
              </Tooltip>
            </div>
          }
          rightContent={
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-md text-sm text-muted-foreground">
                <span>
                  {t('Updated')}{' '}
                  {dayjs(data?.updated).format('MMM DD, hh:mm A')} —{' '}
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
                        class={cn(
                          'h-3.5 w-3.5',
                          isRefreshing && 'animate-spin',
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Refresh analytics')}</TooltipContent>
                </Tooltip>
              </div>

              <Select
                value={selectedTimePeriod}
                onValueChange={handleTimePeriodChange}
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

              <ProjectSelect
                projects={projects ?? []}
                selectedProjectId={selectedProjectId}
                onProjectChange={handleProjectChange}
              />
            </div>
          }
          class="min-w-full"
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} class="w-full ">
          <TabsList
            variant="outline"
            class={cn('border-b w-full', DASHBOARD_CONTENT_PADDING_X)}
          >
            <TabsTrigger variant="outline" value="analytics">
              <LineChart class="w-4 h-4 mr-2" />
              {t('Analytics')}
            </TabsTrigger>
            <TabsTrigger variant="outline" value="details">
              <List class="w-4 h-4 mr-2" />
              {t('Details')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div class={cn('flex flex-col gap-6', DASHBOARD_CONTENT_PADDING_X)}>
              <Summary report={report ?? undefined} />
              <Trends report={report ?? undefined} />
            </div>
          </TabsContent>

          <TabsContent value="details">
            <FlowsDetails
              report={report}
              isLoading={isLoading}
              projects={projects}
            />
          </TabsContent>
        </Tabs>
      </div>
    </LockedFeatureGuard>
  );
}

function parseTimePeriod(period: string | undefined) {
  switch (period) {
    case AnalyticsTimePeriod.LAST_WEEK:
    case AnalyticsTimePeriod.LAST_MONTH:
    case AnalyticsTimePeriod.LAST_THREE_MONTHS:
    case AnalyticsTimePeriod.LAST_SIX_MONTHS:
    case AnalyticsTimePeriod.LAST_YEAR:
      return period;
  }
  return AnalyticsTimePeriod.LAST_MONTH;
}

function parseTab(tab: string | undefined): TabValue {
  return tab === 'details' ? 'details' : 'analytics';
}
