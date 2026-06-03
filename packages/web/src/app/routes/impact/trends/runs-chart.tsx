import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { TrendingUp } from 'lucide-solid';
import { createMemo } from 'solid-js';

import { AnalyticsAreaChart } from './analytics-area-chart';

type RunsChartProps = {
  report?: PlatformAnalyticsReport;
};

export function RunsChart(props: RunsChartProps) {
  const chartData = createMemo(
    () =>
      props.report?.runs
        .map((data) => ({ date: data.day, runs: data.runs }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ) ?? [],
  );

  return (
    <AnalyticsAreaChart
      title={t('Flow Runs Over Time')}
      subtitle={t('Track your automation execution trends')}
      tooltipLabel={t('Runs')}
      dataKey="runs"
      color="#8b5cf6"
      gradientId="fillRuns"
      chartData={chartData()}
      isLoading={!props.report}
      emptyIcon={<TrendingUp class="h-10 w-10 text-muted-foreground/50" />}
      emptyText={t(
        'No runs recorded yet. Data will appear here once your flows start running.',
      )}
      downloadFilename="flow-runs"
    />
  );
}
