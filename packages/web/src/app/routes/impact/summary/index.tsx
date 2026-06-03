import { PlatformAnalyticsReport } from '@activepieces/shared';
import { createMemo } from 'solid-js';

import { ActiveFlowsMetric } from './active-flows-metric';
import { ActiveUsersMetric } from './active-users-metric';
import { FlowRunsMetric } from './flow-runs-metric';
import { TimeSavedMetric } from './time-saved-metric';

type SummaryProps = {
  report?: PlatformAnalyticsReport;
};

export function Summary(props: SummaryProps) {
  const isLoading = createMemo(() => !props.report);

  return (
    <div>
      <div class="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TimeSavedMetric isLoading={isLoading()} report={props.report} />
        <ActiveFlowsMetric report={props.report} />
        <ActiveUsersMetric report={props.report} />
        <FlowRunsMetric report={props.report} />
      </div>
    </div>
  );
}
