import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Clock } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';

import { formatUtils } from '@/lib/format-utils';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type TimeSavedMetricProps = {
  report?: PlatformAnalyticsReport;
  isLoading: boolean;
};

export const TimeSavedMetric = (props: TimeSavedMetricProps) => {
  const flows = createMemo(() => props.report?.flows ?? []);

  const flowsWithTimeSaved = createMemo(() =>
    flows().filter(
      (flow) =>
        flow.timeSavedPerRun !== null &&
        flow.timeSavedPerRun !== undefined &&
        flow.timeSavedPerRun !== 0,
    ),
  );
  const atLeastOneTimeSavedSet = createMemo(
    () => flowsWithTimeSaved().length > 0,
  );

  const totalSeconds = createMemo(() => {
    const report = props.report;
    return atLeastOneTimeSavedSet()
      ? flowsWithTimeSaved().reduce((acc, flow) => {
          const totalRuns =
            report?.runs
              .filter((run) => run.flowId === flow.flowId)
              .reduce((sum, run) => sum + (run.runs ?? 0), 0) ?? 0;
          return acc + (flow.timeSavedPerRun ?? 0) * totalRuns;
        }, 0)
      : 0;
  });
  const totalMinutes = createMemo(() => Math.round(totalSeconds() / 60));
  const equivalentWorkdays = createMemo(() =>
    Math.round(totalSeconds() / 3600 / 8),
  );

  return (
    <Show when={!props.isLoading} fallback={<MetricCardSkeleton />}>
      <Show
        when={atLeastOneTimeSavedSet()}
        fallback={
          <MetricCard
            icon={Clock}
            title={t('Time Saved')}
            value="N/A"
            description={t(
              'Estimated hours saved through automation in the last 3 months. Each automated task saves valuable employee time that can be redirected to high-impact work.',
            )}
            subtitle={t('{days} workdays saved', {
              days: 'N/A',
            })}
            iconColor="text-emerald-500"
            iconBgColor="bg-emerald-500/10"
          />
        }
      >
        <MetricCard
          icon={Clock}
          title={t('Time Saved')}
          value={`${formatUtils.formatNumber(totalMinutes())} mins`}
          description={t('Total time saved by automation')}
          subtitle={t('{days} workdays saved', {
            days: equivalentWorkdays().toLocaleString(),
          })}
          iconColor="text-success"
          iconBgColor="bg-success/10"
        />
      </Show>
    </Show>
  );
};
