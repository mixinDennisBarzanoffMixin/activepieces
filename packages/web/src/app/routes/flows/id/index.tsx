import { isNil, PopulatedFlow } from '@activepieces/shared';
import { A as Link, useParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { FileX } from 'lucide-solid';

import { BuilderPage } from '@/app/builder';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import { LoadingSpinner } from '@/components/custom/spinner';
import { buttonVariants } from '@/components/ui/button';
import { flowsApi, sampleDataHooks } from '@/features/flows';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { ReactFlowProvider } from '../../../builder/flow-canvas/solid-flow-adapter';

const FlowBuilderPage = () => {
  const params = useParams();

  const {
    data: flow,
    isLoading,
    isError,
  } = createQuery<PopulatedFlow, Error>(() => ({
    queryKey: ['flow', params.flowId, authenticationSession.getProjectId()],
    queryFn: () => flowsApi.get(params.flowId!),
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  }));

  const { data: sampleData, isLoading: isSampleDataLoading } =
    sampleDataHooks.useSampleDataForFlow(flow?.version, flow?.projectId);

  const { data: sampleDataInput, isLoading: isSampleDataInputLoading } =
    sampleDataHooks.useSampleDataInputForFlow(flow?.version, flow?.projectId);
  if (isLoading || isSampleDataLoading || isSampleDataInputLoading) {
    return (
      <div class="bg-background flex h-full w-full items-center justify-center ">
        <LoadingSpinner isLarge={true} />
      </div>
    );
  }

  if (isNil(flow) || isError) {
    return (
      <div class="flex flex-col items-center justify-center h-full text-center space-y-4">
        <div class="rounded-full bg-muted p-4">
          <FileX class="size-9 text-muted-foreground" />
        </div>

        <div>
          <h2 class="text-lg font-semibold">{t('Flow not found')}</h2>
          <p class="text-sm text-muted-foreground">
            {t("The flow you are looking for doesn't exist or was removed.")}
          </p>
        </div>

        <Link
          class={cn(buttonVariants({ variant: 'outline' }))}
          href="/dashboard"
        >
          {t('Go to Dashboard')}
        </Link>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <BuilderStateProvider
        flow={flow}
        flowVersion={flow.version}
        readonly={false}
        hideTestWidget={false}
        run={null}
        outputSampleData={sampleData ?? {}}
        inputSampleData={sampleDataInput ?? {}}
      >
        <BuilderPage />
      </BuilderStateProvider>
    </ReactFlowProvider>
  );
};

export { FlowBuilderPage };
