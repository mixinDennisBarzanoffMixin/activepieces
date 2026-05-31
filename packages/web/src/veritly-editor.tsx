import { PopulatedFlow, isNil } from '@activepieces/shared';
import { createQuery } from '@tanstack/solid-query';

import { ReactFlowProvider } from './app/builder/flow-canvas/solid-flow-adapter';
import { BuilderPage } from './app/builder';
import { BuilderStateProvider } from './app/builder/state/builder-state-provider';
import { LoadingSpinner } from './components/custom/spinner';
import { flowsApi, sampleDataHooks } from './features/flows';

function VeritlyAutomationEditor(props: {
  flowId: string;
  path: string;
  name?: string;
}) {
  const flowQuery = createQuery<PopulatedFlow, Error>(() => ({
    queryKey: ['veritly-flow', props.flowId],
    queryFn: () => flowsApi.get(props.flowId),
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  }));

  const sampleDataQuery = sampleDataHooks.useSampleDataForFlow(
    flowQuery.data?.version,
    flowQuery.data?.projectId,
  );

  const sampleDataInputQuery = sampleDataHooks.useSampleDataInputForFlow(
    flowQuery.data?.version,
    flowQuery.data?.projectId,
  );

  if (
    flowQuery.isLoading ||
    sampleDataQuery.isLoading ||
    sampleDataInputQuery.isLoading
  ) {
    return (
      <div class="flex h-full w-full items-center justify-center bg-background">
        <LoadingSpinner isLarge={true} />
      </div>
    );
  }

  if (isNil(flowQuery.data) || flowQuery.isError) {
    return (
      <div class="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <div class="font-medium text-foreground">Automation flow not found</div>
        <div>{props.name ?? props.path}</div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <BuilderStateProvider
        flow={flowQuery.data}
        flowVersion={flowQuery.data.version}
        readonly={false}
        hideTestWidget={false}
        run={null}
        outputSampleData={sampleDataQuery.data ?? {}}
        inputSampleData={sampleDataInputQuery.data ?? {}}
      >
        <BuilderPage />
      </BuilderStateProvider>
    </ReactFlowProvider>
  );
}

export default VeritlyAutomationEditor;
