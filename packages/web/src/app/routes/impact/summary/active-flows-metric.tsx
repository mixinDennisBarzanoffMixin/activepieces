import { FlowStatus, PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Workflow } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type ActiveFlowsMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const ActiveFlowsMetric = (props: ActiveFlowsMetricProps) => {
  const activeFlows = createMemo(
    () =>
      props.report?.flows.filter((flow) => flow.status === FlowStatus.ENABLED)
        .length ?? 0,
  );
  const totalFlows = createMemo(() => props.report?.flows.length ?? 0);

  return (
    <Show when={props.report} fallback={<MetricCardSkeleton />}>
      <MetricCard
        icon={Workflow}
        title={t('Active Flows')}
        value={activeFlows().toLocaleString()}
        description={t('Number of currently active flows')}
        subtitle={t('{total} total flows created', {
          total: totalFlows().toLocaleString(),
        })}
        iconColor="text-purple-500"
        iconBgColor="bg-purple-500/10"
      />
    </Show>
  );
};
