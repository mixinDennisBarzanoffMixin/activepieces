import {
  AgentResult,
  AgentTaskStatus,
  FlowAction,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2, Play } from 'lucide-solid';
import { Show, createMemo, createSignal, mergeProps } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { DataDisplayTabs } from '../data-display/data-display-tabs';

import { AgentTestStep, isRunAgent } from './agent-test-step';
import { TestPanelHeader } from './test-panel-header';
import { TestPanelViewToggle } from './test-panel-view-toggle';
import { TestButtonTooltip } from './test-step-tooltip';

type TestSampleDataViewerProps = {
  isValid: boolean;
  currentStep?: FlowAction;
  isTesting: boolean;
  agentResult?: AgentResult;
  sampleData?: unknown;
  sampleDataInput?: unknown;
  errorMessage: string | null;
  lastTestDate: string | undefined;
  children?: any;
  consoleLogs: string | null;
} & (
  | {
      hideCancel: true;
      onCancelTesting?: undefined;
    }
  | {
      hideCancel?: false;
      onCancelTesting: () => void;
    }
) &
  RetestButtonProps;

type RetestButtonProps = {
  isValid: boolean;
  isSaving: boolean;
  isTesting: boolean;
  onRetest: () => void;
};

type ActiveTab = 'Input' | 'Output' | 'Logs';

const isConsoleLogsValid = (value: unknown) => {
  if (isNil(value)) return false;
  return value !== '';
};

export const TestSampleDataViewer = (props: TestSampleDataViewerProps) => {
  const [requestedTab, setActiveTab] = createSignal<ActiveTab>('Output');
  const hasInput = createMemo(() => !isNil(props.sampleDataInput));
  const hasLogs = createMemo(() => isConsoleLogsValid(props.consoleLogs));
  const activeTab = createMemo<ActiveTab>(() =>
    (requestedTab() === 'Input' && !hasInput()) ||
    (requestedTab() === 'Logs' && !hasLogs())
      ? 'Output'
      : requestedTab(),
  );
  const agent = createMemo(() => getAgentResult(props.sampleData));
  const failed = createMemo(
    () =>
      !isNil(props.errorMessage) ||
      (isRunAgent(props.currentStep) &&
        agent()?.status === AgentTaskStatus.FAILED),
  );
  const status = createMemo(() =>
    props.isTesting ? 'testing' : failed() ? 'failed' : 'success',
  );
  const output = createMemo(() =>
    !isNil(props.errorMessage) ? props.errorMessage : props.sampleData,
  );
  const data = createMemo(() =>
    activeTab() === 'Input'
      ? props.sampleDataInput
      : activeTab() === 'Logs'
      ? props.consoleLogs
      : output(),
  );
  const agentView = createMemo(
    () => isRunAgent(props.currentStep) && isNil(props.errorMessage),
  );

  return (
    <div class="flex flex-col h-full w-full min-h-0">
      <TestPanelHeader status={status()} lastTestDate={props.lastTestDate} />
      <Show when={!props.isTesting}>{props.children}</Show>
      <div class="flex-1 flex flex-col w-full text-start min-h-0">
        <Show when={props.errorMessage && !props.isTesting}>
          <div class="px-3 pt-2 text-xs text-muted-foreground shrink-0">
            {t('Errors are not saved on refresh')}
          </div>
        </Show>
        <Show when={!agentView()}>
          <TestPanelToolbar
            activeTab={activeTab()}
            setActiveTab={setActiveTab}
            hasInput={hasInput()}
            hasLogs={hasLogs()}
            disabled={props.isTesting}
          />
        </Show>
        <div class="flex-1 min-h-0 px-3 pb-3 overflow-auto">
          <Show
            when={props.isTesting && !agentView()}
            fallback={
              agentView() ? (
                <AgentTestStep
                  agentResult={agent()}
                  errorMessage={props.errorMessage}
                />
              ) : (
                <DataDisplayTabs
                  data={data()}
                  title={t(activeTab())}
                  copyableData={data()}
                  downloadFileName={`${
                    props.currentStep?.name ?? 'output'
                  }-${activeTab().toLowerCase()}`}
                />
              )
            }
          >
            <TestingPreviewContent data={data()} />
          </Show>
        </div>
      </div>
      <Show
        when={props.isTesting}
        fallback={
          <RetestActionBar
            onRetest={props.onRetest}
            disabled={!props.isValid || props.isSaving}
            isValid={props.isValid}
            isSaving={props.isSaving}
          />
        }
      >
        <CancelTestingBar
          onCancel={props.hideCancel ? undefined : props.onCancelTesting}
        />
      </Show>
    </div>
  );
};

type TestPanelToolbarProps = {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  hasInput: boolean;
  hasLogs: boolean;
  disabled?: boolean;
};

const TestPanelToolbar = (_props: TestPanelToolbarProps) => {
  const props = mergeProps({ disabled: false }, _props);
  return (
    <div class="flex items-center justify-between px-3 py-2 gap-2 shrink-0">
      <SegmentedTabs
        activeTab={props.activeTab}
        setActiveTab={props.setActiveTab}
        hasInput={props.hasInput}
        hasLogs={props.hasLogs}
        disabled={props.disabled}
      />
      <TestPanelViewToggle disabled={props.disabled} />
    </div>
  );
};
type SegmentedTabsProps = TestPanelToolbarProps;

const SegmentedTabs = (props: SegmentedTabsProps) => (
  <div
    class={cn(
      'inline-flex items-center rounded-md bg-muted p-0.5 gap-0.5',
      props.disabled && 'opacity-50',
    )}
  >
    <SegmentedTabsButton
      label={t('Output')}
      active={props.activeTab === 'Output'}
      onClick={() => props.setActiveTab('Output')}
      disabled={props.disabled}
    />
    <Show when={props.hasInput}>
      <SegmentedTabsButton
        label={t('Input')}
        active={props.activeTab === 'Input'}
        onClick={() => props.setActiveTab('Input')}
        disabled={props.disabled}
      />
    </Show>
    <Show when={props.hasLogs}>
      <SegmentedTabsButton
        label={t('Logs')}
        active={props.activeTab === 'Logs'}
        onClick={() => props.setActiveTab('Logs')}
        disabled={props.disabled}
      />
    </Show>
  </div>
);

type SegmentedTabsButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
};

const SegmentedTabsButton = (props: SegmentedTabsButtonProps) => (
  <button
    type="button"
    onClick={() => props.onClick()}
    disabled={props.disabled}
    class={cn(
      'px-3 py-1 text-xs font-medium rounded-sm transition-colors disabled:cursor-not-allowed',
      props.active
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground',
    )}
  >
    {props.label}
  </button>
);

type RetestActionBarProps = {
  onRetest: () => void;
  disabled: boolean;
  isValid: boolean;
  isSaving: boolean;
};

const RetestActionBar = (props: RetestActionBarProps) => (
  <div
    data-test-panel-trigger
    class="relative px-3 py-3 bg-background z-10 shrink-0"
  >
    <div
      aria-hidden
      class="pointer-events-none absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent"
    />
    <TestButtonTooltip saving={props.isSaving} invalid={!props.isValid}>
      <Button
        variant="outline"
        onClick={props.onRetest}
        disabled={props.disabled}
        keyboardShortcut="G"
        onKeyboardShortcut={props.onRetest}
        class="w-full justify-center bg-primary/5 enabled:hover:bg-primary/15 enabled:hover:text-primary text-primary border-primary/20"
        size="sm"
      >
        <Play class="size-4 fill-current" />
        {t('Retest Step')}
      </Button>
    </TestButtonTooltip>
  </div>
);

type CancelTestingBarProps = {
  onCancel?: () => void;
};

const CancelTestingBar = (props: CancelTestingBarProps) => (
  <div
    data-test-panel-trigger
    class="relative px-3 py-3 bg-background z-10 shrink-0"
  >
    <div
      aria-hidden
      class="pointer-events-none absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent"
    />
    <Button
      onClick={props.onCancel}
      disabled={!props.onCancel}
      variant="outline"
      class="w-full justify-center bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
      size="sm"
    >
      <Loader2 class="size-4 animate-spin" />
      {t('Cancel Testing')}
    </Button>
  </div>
);

type TestingPreviewContentProps = {
  data: unknown;
};

const TestingPreviewContent = (props: TestingPreviewContentProps) => {
  return (
    <Show when={!isNil(props.data)} fallback={<JsonTreeSkeleton />}>
      <div class="opacity-40 animate-pulse pointer-events-none select-none">
        <DataDisplayTabs data={props.data} title={t('Output')} />
      </div>
    </Show>
  );
};

const JsonTreeSkeleton = () => (
  <div class="flex flex-col gap-3 py-3 animate-pulse">
    <Skeleton class="h-3 w-24" />
    <div class="pl-4 flex flex-col gap-2.5">
      <Skeleton class="h-3 w-32" />
      <div class="pl-4 flex flex-col gap-2.5">
        <Skeleton class="h-3 w-48" />
        <Skeleton class="h-3 w-40" />
        <Skeleton class="h-3 w-44" />
      </div>
      <Skeleton class="h-3 w-28" />
      <div class="pl-4 flex flex-col gap-2.5">
        <Skeleton class="h-3 w-36" />
        <Skeleton class="h-3 w-52" />
      </div>
      <Skeleton class="h-3 w-32" />
    </div>
  </div>
);

//In case the user has mangled sample data
function getAgentResult(sampleData: unknown) {
  if (isNil(sampleData)) return undefined;
  if (typeof sampleData !== 'object' || sampleData === null) return undefined;
  if (!('status' in sampleData)) return undefined;
  if (!('steps' in sampleData)) return undefined;
  if (!('prompt' in sampleData)) return undefined;
  return sampleData as AgentResult;
}
