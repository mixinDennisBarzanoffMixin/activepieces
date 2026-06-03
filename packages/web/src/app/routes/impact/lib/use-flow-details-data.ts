import { PlatformAnalyticsReport } from '@activepieces/shared';
import { Accessor, useContext, createMemo } from 'solid-js';

import { RefreshAnalyticsContext } from '@/features/platform-admin';

export type FlowDetailRow = PlatformAnalyticsReport['flows'][number] & {
  id: string;
  runs: number;
  minutesSaved: number;
};

export type Owner = { id: string; name: string };

export function useFlowDetailsData(
  report: Accessor<PlatformAnalyticsReport | undefined>,
) {
  const { timeSavedPerRunOverrides, setTimeSavedPerRunOverride } = useContext(
    RefreshAnalyticsContext,
  );

  const runsMap = createMemo(() => {
    const data = report();
    if (!data) return new Map<string, number>();
    return new Map(data.runs.map((run) => [run.flowId, run.runs ?? 0]));
  });

  const flowDetails = createMemo((): FlowDetailRow[] | undefined => {
    const data = report();
    if (!data) return undefined;
    return data.flows.map((flow) => {
      const override = timeSavedPerRunOverrides[flow.flowId];
      const timeSavedPerRun = override.value ?? flow.timeSavedPerRun;
      const runs = runsMap().get(flow.flowId) ?? 0;
      return {
        ...flow,
        id: flow.flowId,
        timeSavedPerRun,
        runs,
        minutesSaved: (timeSavedPerRun ?? 0) * runs,
      };
    });
  });

  const uniqueOwners = createMemo((): Owner[] => {
    const data = flowDetails();
    if (!data) return [];
    const ownerMap = new Map<string, Owner>();
    data.forEach((flow) => {
      if (flow.ownerId && !ownerMap.has(flow.ownerId)) {
        ownerMap.set(flow.ownerId, {
          id: flow.ownerId,
          name: flow.ownerId,
        });
      }
    });
    return Array.from(ownerMap.values());
  });

  const flowsMissingTimeSaved = createMemo(() => {
    const data = flowDetails();
    if (!data) return 0;
    return data.filter(
      (flow) => flow.timeSavedPerRun === null || flow.timeSavedPerRun === 0,
    ).length;
  });

  return {
    flowDetails,
    uniqueOwners,
    flowsMissingTimeSaved,
    timeSavedPerRunOverrides,
    setTimeSavedPerRunOverride,
  };
}
