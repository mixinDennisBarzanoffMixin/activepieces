import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Brain,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Search,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-solid';
import { AnimatePresence, motion } from 'motion/react';
import { Component, createMemo, createSignal, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { TextShimmer } from '@/components/ui/text-shimmer';
import {
  AnyToolPart,
  ThinkingStep,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { cn } from '@/lib/utils';

export function ThinkingBlock(props: {
  thinkingSteps: ThinkingStep[];
  reasoningText: string;
  isStreaming: boolean;
  thinkingDurationMs?: number;
}) {
  const [isOpen, setIsOpen] = createSignal(false);

  const hasReasoning = () => props.reasoningText.length > 0;
  const hasSteps = () => props.thinkingSteps.length > 0;
  const isExpandable = () => hasSteps() || hasReasoning();
  const visible = () => hasSteps() || hasReasoning() || props.isStreaming;
  const done = () =>
    props.thinkingDurationMs !== undefined
      ? t('Thought for {seconds} seconds', {
          seconds: Math.round(props.thinkingDurationMs / 1000),
        })
      : t('Thought for a few seconds');

  const lastStep = () =>
    hasSteps() ? props.thinkingSteps[props.thinkingSteps.length - 1] : null;
  const lastStepIdx = () => props.thinkingSteps.length - 1;

  return (
    <Show when={visible()}>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <button
            type="button"
            disabled={!isExpandable()}
            onClick={() => setIsOpen(!isOpen())}
            class={cn(
              'flex items-center gap-1.5 text-sm text-muted-foreground text-left w-full',
              isExpandable() &&
                'hover:text-foreground transition-colors cursor-pointer',
            )}
          >
            <Show when={props.isStreaming} fallback={<span>{done()}</span>}>
              <TextShimmer class="text-sm" duration={3}>
                {t('Thinking...')}
              </TextShimmer>
            </Show>
            <Show when={isExpandable()}>
              <ChevronDown
                class={cn(
                  'size-4 shrink-0 text-muted-foreground/50 transition-transform',
                  isOpen() && 'rotate-180',
                )}
              />
            </Show>
          </button>

          <Show when={!isOpen() && props.isStreaming && lastStep()}>
            {(step) => (
              <div class="mt-3 ml-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`step-${lastStepIdx()}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StepRenderer
                      step={step()}
                      showConnector={false}
                      isStreaming={true}
                      showIcon={false}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </Show>

          <CollapsibleContent class="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <div class="mt-3 ml-1">
              <For each={props.thinkingSteps}>
                {(step) => (
                  <StepRenderer
                    step={step}
                    showConnector={true}
                    isStreaming={props.isStreaming}
                    showIcon={true}
                  />
                )}
              </For>

              <Show when={!props.isStreaming && hasSteps()}>
                <div class="flex gap-3 items-center">
                  <div class="flex items-center justify-center size-5 rounded-full bg-muted">
                    <Check class="size-3 text-muted-foreground" />
                  </div>
                  <span class="text-xs text-muted-foreground">{t('Done')}</span>
                </div>
              </Show>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>
    </Show>
  );
}

function StepRenderer(props: {
  step: ThinkingStep;
  showConnector: boolean;
  isStreaming: boolean;
  showIcon: boolean;
}) {
  const reasoning = () =>
    props.step.kind === 'reasoning' ? props.step : undefined;
  const status = () =>
    props.step.kind === 'thinking-status' ? props.step : undefined;
  const tool = () => (props.step.kind === 'tool' ? props.step : undefined);
  const part = () => status()?.toolPart;

  return (
    <Show
      when={reasoning()}
      fallback={
        <Show
          when={status()}
          fallback={
            <Show when={tool()}>
              {(step) => (
                <ToolStep
                  part={step().part}
                  showConnector={props.showConnector}
                  showIcon={props.showIcon}
                />
              )}
            </Show>
          }
        >
          {(step) => (
            <Show
              when={part()}
              fallback={
                <StepLayout
                  showIcon={props.showIcon}
                  showConnector={props.showConnector}
                  icon={Clock}
                >
                  <Show
                    when={props.isStreaming}
                    fallback={
                      <p class="text-xs text-muted-foreground">{step().text}</p>
                    }
                  >
                    <TextShimmer class="text-sm" duration={3}>
                      {step().text}
                    </TextShimmer>
                  </Show>
                </StepLayout>
              }
            >
              {(tool) => (
                <ToolStep
                  part={tool()}
                  showConnector={props.showConnector}
                  showIcon={props.showIcon}
                  label={step().text}
                />
              )}
            </Show>
          )}
        </Show>
      }
    >
      {(step) => (
        <StepLayout
          showIcon={props.showIcon}
          showConnector={props.showConnector}
          icon={Brain}
        >
          <p
            class={cn(
              'whitespace-pre-wrap break-words line-clamp-3',
              props.isStreaming
                ? 'text-sm text-foreground'
                : 'text-xs text-muted-foreground',
            )}
          >
            {step().text}
          </p>
        </StepLayout>
      )}
    </Show>
  );
}

function StepLayout(props: {
  showIcon: boolean;
  showConnector: boolean;
  icon: Component<{ class?: string }>;
  children: JSX.Element;
}) {
  return (
    <div class="flex gap-3">
      <Show when={props.showIcon}>
        <div class="flex flex-col items-center shrink-0">
          <div class="flex items-center justify-center size-5 rounded-full bg-muted">
            <props.icon class="size-3 text-muted-foreground" />
          </div>
          <Show when={props.showConnector}>
            <div class="w-px flex-1 bg-border min-h-3" />
          </Show>
        </div>
      </Show>
      <div class="flex-1 min-w-0 pb-4 pt-0.5">{props.children}</div>
    </div>
  );
}

function ToolStep(props: {
  part: AnyToolPart;
  showConnector: boolean;
  showIcon: boolean;
  label?: string;
}) {
  const status = createMemo(() => chatPartUtils.deriveToolStatus(props.part));
  const icon = createMemo(() =>
    status() === 'running' ? Loader2 : status() === 'failed' ? XCircle : Wrench,
  );

  return (
    <StepLayout
      showIcon={props.showIcon}
      showConnector={props.showConnector}
      icon={icon()}
    >
      <ToolCard part={props.part} label={props.label} />
    </StepLayout>
  );
}

function ToolCard(props: { part: AnyToolPart; label?: string }) {
  const [detailsOpen, setDetailsOpen] = createSignal(false);
  const input = () =>
    isObject(props.part.input) ? props.part.input : undefined;
  const output = () => chatPartUtils.extractToolOutputText(props.part);
  const hasInput = () => {
    const value = input();
    return value !== undefined && Object.keys(value).length > 0;
  };
  const hasOutput = () => output() !== undefined && output().length > 0;
  const hasDetails = () => hasInput() || hasOutput();
  const parsedOutput = createMemo(() =>
    detailsOpen() && hasOutput() ? tryParseJson(output()) : undefined,
  );
  const pieceNames = createMemo(() => chatPartUtils.extractPieceNames(input()));
  const { summaries: pieceSummaries } = piecesHooks.usePieceSummariesByNames({
    names: pieceNames,
  });
  const summary = createMemo(() => buildToolSummary({ part: props.part }));
  const label = () => {
    if (props.label !== undefined) return props.label;
    return summary().label;
  };
  const primaryPiece = createMemo(() =>
    pieceSummaries().find((piece) => piece.logoUrl),
  );

  return (
    <Collapsible open={detailsOpen()} onOpenChange={setDetailsOpen}>
      <div
        class={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1',
          hasDetails() && 'cursor-pointer hover:bg-muted/50 transition-colors',
        )}
        onClick={() => hasDetails() && setDetailsOpen(!detailsOpen())}
      >
        <Show
          when={primaryPiece()}
          keyed
          fallback={
            <Dynamic
              component={summary().icon}
              class="size-3 text-muted-foreground shrink-0"
            />
          }
        >
          {(piece) => (
            <PieceIcon
              displayName={piece.displayName}
              logoUrl={piece.logoUrl}
              size="xxs"
              border={false}
              showTooltip={false}
            />
          )}
        </Show>
        <span class="text-xs text-muted-foreground whitespace-nowrap">
          {label()}
        </span>
        <Show when={hasDetails()}>
          <ChevronDown
            class={cn(
              'size-3 shrink-0 text-muted-foreground/50 transition-transform',
              detailsOpen() && 'rotate-180',
            )}
          />
        </Show>
      </div>
      <Show when={hasDetails()}>
        <CollapsibleContent class="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div class="mt-1.5 space-y-1.5 text-[11px]">
            <Show when={hasInput() && input()}>
              {(data) => (
                <div>
                  <p class="text-muted-foreground font-medium mb-0.5">
                    {t('Input')}
                  </p>
                  <SimpleJsonViewer
                    data={data()}
                    hideCopyButton={true}
                    maxHeight={100}
                    fontSize="11px"
                  />
                </div>
              )}
            </Show>
            <Show when={hasOutput() && parsedOutput() !== undefined}>
              <div>
                <p class="text-muted-foreground font-medium mb-0.5">
                  {t('Output')}
                </p>
                <SimpleJsonViewer
                  data={parsedOutput()}
                  hideCopyButton={true}
                  maxHeight={120}
                  fontSize="11px"
                />
              </div>
            </Show>
          </div>
        </CollapsibleContent>
      </Show>
    </Collapsible>
  );
}

function buildToolSummary({ part }: { part: AnyToolPart }): {
  icon: Component<{ class?: string }>;
  label: string;
} {
  const toolName = chatPartUtils.getToolPartName(part);
  const icon =
    toolName === 'ap_run_one_time_action'
      ? Zap
      : toolName.startsWith('mcp__')
      ? Wrench
      : Search;
  return { icon, label: chatUtils.formatToolActionName({ part }) };
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
