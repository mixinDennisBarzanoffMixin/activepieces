import './polyfills';
import './i18n';

import {
  AuthenticationResponse,
  isNil,
  PopulatedFlow,
} from '@activepieces/shared';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { jwtDecode } from 'jwt-decode';
import React, { StrictMode, useContext, useEffect, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { BuilderPage } from '@/app/builder';
import { BuilderStateContext } from '@/app/builder/builder-hooks';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import { queryClient } from '@/app/query-client';
import { ApErrorDialog } from '@/components/custom/ap-error-dialog/ap-error-dialog';
import { LoadingSpinner } from '@/components/custom/spinner';
import {
  EmbeddingProvider,
  useEmbedding,
} from '@/components/providers/embed-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { flowsApi, sampleDataHooks } from '@/features/flows';
import { api, setVeritlyProjectId } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { ActivepiecesSave } from './veritly-save';

export type VeritlyAutomationEditorProps = {
  flowId: string;
  path: string;
  name?: string;
  projectId: string;
};

type RootProps = VeritlyAutomationEditorProps & {
  register: (flush: (() => Promise<void>) | undefined) => void;
};

function VeritlyFlush(props: Pick<RootProps, 'register'>) {
  const store = useContext(BuilderStateContext);
  if (!store) throw new Error('Missing Activepieces builder store');
  const register = props.register;

  useEffect(() => {
    const save = new ActivepiecesSave(store);
    register(() => save.flush());
    return () => register(undefined);
  }, [register, store]);

  return null;
}

function VeritlyAutomationEditor(props: RootProps) {
  useEffect(() => {
    setVeritlyProjectId(props.projectId);
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
        <VeritlyFlush register={props.register} />
        <BuilderPage />
      </BuilderStateProvider>
    </ReactFlowProvider>
  );
}

function VeritlySession(
  props: React.PropsWithChildren<
    Pick<VeritlyAutomationEditorProps, 'projectId'>
  >,
) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    authenticationSession.clearSession();
    setVeritlyProjectId(props.projectId);
  }, [props.projectId]);

  const session = useQuery<AuthenticationResponse, Error>({
    queryKey: ['veritly-session', props.projectId],
    queryFn: () => {
      setVeritlyProjectId(props.projectId);
      return api.get('/v1/veritly/session');
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!session.data) return;
    if (!isValidSession(session.data)) {
      authenticationSession.clearSession();
      setReady(false);
      return;
    }
    authenticationSession.saveResponse(session.data, true);
    setReady(true);
  }, [session.data]);

  if (session.isError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <div className="font-medium text-foreground">
          Automation session not available
        </div>
        <div>{session.error.message}</div>
      </div>
    );
  }

  if (session.data && !isValidSession(session.data)) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <div className="font-medium text-foreground">
          Automation session is invalid
        </div>
      </div>
    );
  }

  if (session.isLoading || !ready) {
    return (
      <div className="bg-background flex h-full w-full items-center justify-center">
        <LoadingSpinner isLarge={true} />
      </div>
    );
  }

  return <>{props.children}</>;
}

function isValidSession(session: AuthenticationResponse) {
  if (!session.token || session.token.split('.').length !== 3) return false;
  try {
    jwtDecode(session.token);
    return true;
  } catch {
    return false;
  }
}

function VeritlyEmbedding(props: React.PropsWithChildren) {
  const { setEmbedState } = useEmbedding();

  useEffect(() => {
    setEmbedState((state) => ({
      ...state,
      isEmbedded: true,
      hideSideNav: true,
      hideFlowsPageNavbar: true,
      disableNavigationInBuilder: true,
      hideFolders: true,
      hideTables: true,
      hideExportAndImportFlow: true,
      useDarkBackground: false,
      hideHomeButtonInBuilder: true,
      emitHomeButtonClickedEvent: false,
      homeButtonIcon: 'back',
      hideDuplicateFlow: true,
      hidePageHeader: true,
    }));
  }, [setEmbedState]);

  return <>{props.children}</>;
}

export default function VeritlyAutomationEditorRoot(props: RootProps) {
  return (
    <StrictMode>
      <EmbeddingProvider>
        <VeritlyEmbedding>
          <div className="h-screen min-h-0 w-screen overflow-hidden bg-background text-foreground">
            <QueryClientProvider client={queryClient}>
              <VeritlySession {...props}>
                <SocketProvider>
                  <TooltipProvider>
                    <MemoryRouter
                      key={props.flowId}
                      initialEntries={[
                        `/projects/${props.projectId}/flows/${props.flowId}`,
                      ]}
                    >
                      <VeritlyAutomationEditor {...props} />
                    </MemoryRouter>
                    <Toaster position="bottom-right" />
                    <ApErrorDialog />
                  </TooltipProvider>
                </SocketProvider>
              </VeritlySession>
            </QueryClientProvider>
          </div>
        </VeritlyEmbedding>
      </EmbeddingProvider>
    </StrictMode>
  );
}
