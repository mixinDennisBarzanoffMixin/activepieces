import { PlatformAnalyticsReport } from '@activepieces/shared';

import { RunsChart } from './runs-chart';
import { TimeSavedChart } from './time-saved-chart';

type TrendsProps = {
  report?: PlatformAnalyticsReport;
};

export function Trends(props: TrendsProps) {
  return (
    <div class="space-y-6 mb-6">
      <RunsChart report={props.report} />
      <TimeSavedChart report={props.report} />
    </div>
  );
}
