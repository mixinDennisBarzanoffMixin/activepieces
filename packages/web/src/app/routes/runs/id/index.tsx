import { FlowRun, PopulatedFlow } from '@activepieces/shared';
import { useParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { Show } from 'solid-js';

import { BuilderPage } from '@/app/builder';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import { LoadingSpinner } from '@/components/custom/spinner';
import { flowRunsApi } from '@/features/flow-runs';
import { flowsApi, sampleDataHooks } from '@/features/flows';

import { ReactFlowProvider } from '../../../builder/flow-canvas/solid-flow-adapter';

const FlowRunPage = () => {
  const params = useParams();
  const { data, isLoading } = createQuery<
    {
      run: FlowRun;
      flow: PopulatedFlow;
    },
    Error
  >(() => ({
    queryKey: ['run', params.runId],
    queryFn: async () => {
      const flowRun = await flowRunsApi.getPopulated(params.runId!);
      const flow = await flowsApi.get(flowRun.flowId, {
        versionId: flowRun.flowVersionId,
      });
      return {
        run: flowRun,
        flow: flow,
      };
    },
    enabled: params.runId !== undefined,
    refetchInterval: 15000,
  }));

  const { data: sampleData, isLoading: isSampleDataLoading } =
    sampleDataHooks.useSampleDataForFlow(data?.flow.version, params.projectId);

  const { data: sampleDataInput, isLoading: isSampleDataInputLoading } =
    sampleDataHooks.useSampleDataInputForFlow(
      data?.flow.version,
      params.projectId,
    );

  if (isLoading || isSampleDataLoading || isSampleDataInputLoading) {
    return (
      <div class="bg-background flex h-full w-full items-center justify-center ">
        <LoadingSpinner isLarge={true} />
      </div>
    );
  }

  return (
    <Show when={data}>
      <ReactFlowProvider>
        <BuilderStateProvider
          flow={data.flow}
          flowVersion={data.flow.version}
          readonly={true}
          hideTestWidget={false}
          run={data.run}
          outputSampleData={sampleData ?? {}}
          inputSampleData={sampleDataInput ?? {}}
        >
          <BuilderPage />
        </BuilderStateProvider>
      </ReactFlowProvider>
    </Show>
  );
};

export { FlowRunPage };
