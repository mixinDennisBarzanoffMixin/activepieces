import './polyfills';
import './i18n';
import './styles.css';

import { isNil, PopulatedFlow } from '@activepieces/shared';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import React, { StrictMode, useEffect } from 'react';

import { BuilderPage } from '@/app/builder';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import { queryClient } from '@/app/query-client';
import { ApErrorDialog } from '@/components/custom/ap-error-dialog/ap-error-dialog';
import { LoadingSpinner } from '@/components/custom/spinner';
import { SocketProvider } from '@/components/providers/socket-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { flowsApi, sampleDataHooks } from '@/features/flows';
import { setVeritlyProjectId } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

export type VeritlyAutomationEditorProps = {
  flowId: string;
  path: string;
  name?: string;
  projectId: string;
};

function VeritlyAutomationEditor(props: VeritlyAutomationEditorProps) {
  useEffect(() => {
    setVeritlyProjectId(props.projectId);
    authenticationSession.setProjectId(props.projectId);
  }, [props.projectId]);

  const flow = useQuery<PopulatedFlow, Error>({
    queryKey: ['veritly-flow', props.flowId, props.projectId],
    queryFn: () => flowsApi.get(props.flowId),
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const sample = sampleDataHooks.useSampleDataForFlow(
    flow.data?.version,
    flow.data?.projectId,
  );
  const input = sampleDataHooks.useSampleDataInputForFlow(
    flow.data?.version,
    flow.data?.projectId,
  );

  if (flow.isLoading || sample.isLoading || input.isLoading) {
    return (
      <div className="bg-background flex h-full w-full items-center justify-center">
        <LoadingSpinner isLarge={true} />
      </div>
    );
  }

  if (isNil(flow.data) || flow.isError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <div className="font-medium text-foreground">
          Automation flow not found
        </div>
        <div>{props.name || props.path}</div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <BuilderStateProvider
        flow={flow.data}
        flowVersion={flow.data.version}
        readonly={false}
        hideTestWidget={false}
        run={null}
        outputSampleData={sample.data ?? {}}
        inputSampleData={input.data ?? {}}
      >
        <BuilderPage />
      </BuilderStateProvider>
    </ReactFlowProvider>
  );
}

export default function VeritlyAutomationEditorRoot(
  props: VeritlyAutomationEditorProps,
) {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <TooltipProvider>
            <VeritlyAutomationEditor {...props} />
            <Toaster position="bottom-right" />
            <ApErrorDialog />
          </TooltipProvider>
        </SocketProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
