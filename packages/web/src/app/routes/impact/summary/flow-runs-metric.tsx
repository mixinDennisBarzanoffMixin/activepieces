import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Zap } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type FlowRunsMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const FlowRunsMetric = (props: FlowRunsMetricProps) => {
  const totalFlowRuns = createMemo(() => {
    const report = props.report;
    return (
      report?.flows.reduce(
        (acc, flow) =>
          acc +
          (report.runs.find((run) => run.flowId === flow.flowId)?.runs ?? 0),
        0,
      ) ?? 0
    );
  });

  return (
    <Show when={props.report} fallback={<MetricCardSkeleton />}>
      <MetricCard
        icon={Zap}
        title={t('Automation Runs')}
        value={totalFlowRuns().toLocaleString()}
        description={t('Total automation executions')}
        iconColor="text-rose-500"
        iconBgColor="bg-rose-500/10"
      />
    </Show>
  );
};
