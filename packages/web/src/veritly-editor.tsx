import { PopulatedFlow } from '@activepieces/shared';
import { Route, Router } from '@solidjs/router';
import { QueryClientProvider, createQuery } from '@tanstack/solid-query';
import { Show, createEffect, untrack } from 'solid-js';

import { BuilderPage } from './app/builder';
import { ReactFlowProvider } from './app/builder/flow-canvas/solid-flow-adapter';
import { BuilderStateProvider } from './app/builder/state/builder-state-provider';
import { queryClient } from './app/query-client';
import { LoadingSpinner } from './components/custom/spinner';
import { flowsApi, sampleDataHooks } from './features/flows';
import { setVeritlyProjectId } from './lib/api';

function VeritlyAutomationEditor(props: {
  flowId: string;
  path: string;
  name?: string;
  projectId: string;
}) {
  createEffect(() => {
    setVeritlyProjectId(props.projectId);
  });

  const flowQuery = createQuery<PopulatedFlow, Error>(() => ({
    queryKey: ['veritly-flow', props.flowId],
    queryFn: () => flowsApi.get(props.flowId),
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  }));

  return (
    <Show
      when={flowQuery.data}
      fallback={
        flowQuery.isError ? (
          <div class="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <div class="font-medium text-foreground">
              Automation flow not found
            </div>
            <div>{props.name ?? props.path}</div>
          </div>
        ) : (
          <div class="flex h-full w-full items-center justify-center bg-background">
            <LoadingSpinner isLarge={true} />
          </div>
        )
      }
    >
      {(loaded) => <VeritlyLoadedAutomationEditor flow={loaded()} />}
    </Show>
  );
}

function VeritlyLoadedAutomationEditor(props: { flow: PopulatedFlow }) {
  const flow = untrack(() => props.flow);
  const sampleDataQuery = sampleDataHooks.useSampleDataForFlow(
    flow.version,
    flow.projectId,
  );

  const sampleDataInputQuery = sampleDataHooks.useSampleDataInputForFlow(
    flow.version,
    flow.projectId,
  );

  return (
    <ReactFlowProvider>
      <BuilderStateProvider
        flow={flow}
        flowVersion={flow.version}
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

export default function VeritlyAutomationEditorRoot(props: {
  flowId: string;
  path: string;
  name?: string;
  projectId: string;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Route
          path="/*"
          component={() => <VeritlyAutomationEditor {...props} />}
        />
      </Router>
    </QueryClientProvider>
  );
}
