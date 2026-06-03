import {
  StepOutputStatus,
  flowStructureUtil,
  AgentResult,
  isFlowRunStateTerminal,
  FlowRun,
  FlowRunStatus,
  isNil,
  ApFlagId,
  LogSliceRef,
  StepOutputType,
  isObject,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Download, Info } from 'lucide-solid';
import { Match, Show, Switch, createMemo, createSignal } from 'solid-js';

import { StepOutputSkeleton } from '@/app/components/step-output-skeleton';
import { buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentTimeline } from '@/features/agents';
import { flowRunUtils } from '@/features/flow-runs';
import { flagsHooks } from '@/hooks/flags-hooks';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';
import { DataDisplayTabs } from '../data-display/data-display-tabs';
import { isRunAgent } from '../test-step/agent-test-step';
import { TestPanelHeader } from '../test-step/test-panel-header';
import { TestPanelViewToggle } from '../test-step/test-panel-view-toggle';

type RunActiveTab = 'input' | 'output' | 'timeline';

export const FlowStepInputOutput = () => {
  const [run, loopsIndexes, selectedStep] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
    state.selectedStep
      ? flowStructureUtil.getStepOrThrow(
          state.selectedStep,
          state.flowVersion.trigger,
        )
      : null,
  ]);
  const isAgent = isRunAgent(selectedStep);
  const [requestedTab, setActiveTab] = createSignal<RunActiveTab>(
    isAgent ? 'timeline' : 'output',
  );
  const activeTab = createMemo<RunActiveTab>(() =>
    requestedTab() === 'timeline' && !isAgent ? 'output' : requestedTab(),
  );
  const selectedStepOutput = createMemo(() => {
    if (!run || !selectedStep) return null;
    return flowRunUtils.extractStepOutput(
      selectedStep.name,
      loopsIndexes,
      run.steps,
    );
  });
  const ready = createMemo(() => {
    const output = selectedStepOutput();
    if (!output || !selectedStep) return undefined;
    return { output, step: selectedStep };
  });
  const { data: rententionDays } = flagsHooks.useFlag<number>(
    ApFlagId.EXECUTION_DATA_RETENTION_DAYS,
  );
  const running = createMemo(
    () => selectedStepOutput()?.status === StepOutputStatus.RUNNING,
  );
  const slice = createMemo(() => {
    const output = selectedStepOutput();
    if (output?.outputType !== StepOutputType.SLICE) return undefined;
    return isLogSliceRef(output.output) ? output.output : undefined;
  });
  const parsed = createMemo(() => {
    const output = selectedStepOutput();
    if (output?.outputType === StepOutputType.SLICE) return undefined;
    return output?.errorMessage ?? output?.output ?? 'No output';
  });
  const done = createMemo(() => {
    if (!run) return false;
    return isFlowRunStateTerminal({
      status: run.status,
      ignoreInternalError: true,
    });
  });
  const loading = createMemo(() => {
    if (!run) return false;
    if (done()) return false;
    if (run.status === FlowRunStatus.PAUSED) return false;
    return isNil(selectedStepOutput());
  });
  const message = createMemo(() =>
    handleRunFailureOrEmptyLog(run, rententionDays),
  );
  const status = createMemo<'success' | 'failed' | 'testing' | 'idle'>(() => {
    const output = selectedStepOutput();
    if (output?.status === StepOutputStatus.FAILED) return 'failed';
    if (output?.status === StepOutputStatus.RUNNING) return 'testing';
    return 'success';
  });

  return (
    <Show when={run}>
      {(flow) => (
        <Switch>
          <Match when={loading()}>
            <StepOutputSkeleton class="p-4" />
          </Match>
          <Match when={message()}>
            {(text) => (
              <div class="flex flex-col justify-center items-center gap-4 w-full pt-8  px-5">
                <Info size={36} class="text-muted-foreground" />
                <h4 class="px-6 text-sm text-center text-muted-foreground ">
                  {text()}
                </h4>
              </div>
            )}
          </Match>
          <Match when={!ready()}>
            <div class="flex flex-col h-full w-full">
              <div class="flex justify-end px-3 py-2 shrink-0">
                <TestPanelViewToggle />
              </div>
              <div class="grow flex flex-col items-center justify-center w-full px-6 py-10 gap-4 text-center">
                <div class="flex items-center justify-center size-12 rounded-full bg-muted text-muted-foreground">
                  <Info class="size-6" />
                </div>
                <div class="flex flex-col gap-1.5 max-w-[280px]">
                  <span class="text-sm font-medium text-foreground">
                    {t("This step didn't run")}
                  </span>
                  <span class="text-xs text-muted-foreground leading-relaxed">
                    {t(
                      'This step was skipped during this run, no input or output was captured.',
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Match>
          <Match when={ready()}>
            {(data) => (
              <div class="h-full flex flex-col">
                <TestPanelHeader
                  status={status()}
                  lastTestDate={flow().created}
                  viewMode="run"
                />
                <ScrollArea class="flex-1 p-3">
                  <Tabs
                    value={activeTab()}
                    onValueChange={(value) => {
                      if (isRunActiveTab(value)) setActiveTab(value);
                    }}
                    class="w-full"
                  >
                    <div class="flex items-center justify-between gap-2 shrink-0 mb-2">
                      <TabsList class="h-9">
                        <TabsTrigger value="input">{t('Input')}</TabsTrigger>
                        <Show when={isAgent}>
                          <TabsTrigger value="timeline">
                            {t('Timeline')}
                          </TabsTrigger>
                        </Show>
                        <TabsTrigger value="output">{t('Output')}</TabsTrigger>
                      </TabsList>
                      <TestPanelViewToggle />
                    </div>

                    <TabsContent value="input">
                      <DataDisplayTabs
                        data={data().output.input}
                        title={t('Input')}
                        copyableData={data().output.input}
                        downloadFileName={`${data().step.name}-input`}
                      />
                    </TabsContent>

                    <Show when={isAgent}>
                      <TabsContent value="timeline">
                        <Show when={isAgentResult(data().output.output)}>
                          {(result) => <AgentTimeline agentResult={result()} />}
                        </Show>
                      </TabsContent>
                    </Show>
                    <TabsContent value="output">
                      <Show
                        when={running()}
                        fallback={
                          <Show
                            when={slice()}
                            fallback={
                              <DataDisplayTabs
                                data={parsed()}
                                title={t('Output')}
                                copyableData={parsed()}
                                downloadFileName={`${data().step.name}-output`}
                              />
                            }
                          >
                            {(ref) => (
                              <SlicedOutputDownload slicedOutputRef={ref()} />
                            )}
                          </Show>
                        }
                      >
                        <StepOutputSkeleton class="p-4" />
                      </Show>
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              </div>
            )}
          </Match>
        </Switch>
      )}
    </Show>
  );
};

const isRunActiveTab = (value: unknown): value is RunActiveTab => {
  return value === 'input' || value === 'output' || value === 'timeline';
};

const isLogSliceRef = (output: unknown): output is LogSliceRef => {
  if (!isObject(output)) return false;
  return typeof output.url === 'string' && typeof output.size === 'number';
};

const isAgentResult = (output: unknown): output is AgentResult => {
  if (!isObject(output)) return false;
  return (
    typeof output.prompt === 'string' &&
    Array.isArray(output.steps) &&
    typeof output.status === 'string'
  );
};

const SlicedOutputDownload = (props: { slicedOutputRef: LogSliceRef }) => (
  <div class="flex flex-col gap-3 p-4 bg-muted rounded-md">
    <div class="flex items-start gap-2 text-sm">
      <Info class="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
      <span>
        {t(
          'Output is too large to display inline ({size}). Download to inspect.',
          { size: formatUtils.formatStorageSize(props.slicedOutputRef.size) },
        )}
      </span>
    </div>
    <a
      href={props.slicedOutputRef.url}
      target="_blank"
      rel="noopener noreferrer"
      download
      class={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'w-fit gap-2',
      )}
    >
      <Download class="w-4 h-4" />
      {t('Download output')}
    </a>
  </div>
);

function handleRunFailureOrEmptyLog(
  run: FlowRun | null,
  retentionDays: number | null,
) {
  if (
    isNil(run) ||
    !isFlowRunStateTerminal({ status: run.status, ignoreInternalError: true })
  ) {
    return null;
  }

  if ([FlowRunStatus.INTERNAL_ERROR].includes(run.status)) {
    return t(
      'There are no logs captured for this run, because of an internal error, please contact support.',
    );
  }

  if (isNil(run.logsFileId)) {
    return t(
      'Logs are kept for {days} days after execution and then deleted.',
      { days: retentionDays },
    );
  }
  return null;
}
