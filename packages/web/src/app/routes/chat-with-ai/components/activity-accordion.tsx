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
import { createMemo, createSignal, For, Show } from 'solid-js';

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

export function ThinkingBlock({
  thinkingSteps,
  reasoningText,
  isStreaming,
  thinkingDurationMs,
}: {
  thinkingSteps: ThinkingStep[];
  reasoningText: string;
  isStreaming: boolean;
  thinkingDurationMs?: number;
}) {
  const [isOpen, setIsOpen] = createSignal(false);

  const hasReasoning = reasoningText.length > 0;
  const hasSteps = thinkingSteps.length > 0;

  if (!hasSteps && !hasReasoning && !isStreaming) return null;

  const isExpandable = hasSteps || hasReasoning;

  const doneLabel =
    thinkingDurationMs !== undefined
      ? t('Thought for {seconds} seconds', {
          seconds: Math.round(thinkingDurationMs / 1000),
        })
      : t('Thought for a few seconds');

  const lastStep = hasSteps ? thinkingSteps[thinkingSteps.length - 1] : null;
  const lastStepIdx = thinkingSteps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <button
          type="button"
          disabled={!isExpandable}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-1.5 text-sm text-muted-foreground text-left w-full',
            isExpandable &&
              'hover:text-foreground transition-colors cursor-pointer',
          )}
        >
          <Show when={isStreaming} fallback={<span>{doneLabel}</span>}>
            <TextShimmer class="text-sm" duration={3}>
              {t('Thinking...')}
            </TextShimmer>
          </Show>
          <Show when={isExpandable}>
            <ChevronDown
              class={cn(
                'size-4 shrink-0 text-muted-foreground/50 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          </Show>
        </button>

        <Show when={!isOpen && isStreaming && lastStep}>
          <div className="mt-3 ml-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${lastStepIdx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StepRenderer
                  step={lastStep}
                  showConnector={false}
                  isStreaming={true}
                  showIcon={false}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </Show>

        <CollapsibleContent class="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="mt-3 ml-1">
            <For each={thinkingSteps}>
              {(step, idx) => (
                <StepRenderer
                  key={
                    step.kind === 'tool'
                      ? step.part.toolCallId
                      : `${step.kind}-${idx}`
                  }
                  step={step}
                  showConnector={true}
                  isStreaming={isStreaming}
                  showIcon={true}
                />
              )}
            </For>

            <Show when={!isStreaming && hasSteps}>
              <div className="flex gap-3 items-center">
                <div className="flex items-center justify-center size-5 rounded-full bg-muted">
                  <Check class="size-3 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {t('Done')}
                </span>
              </div>
            </Show>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

function StepRenderer({
  step,
  showConnector,
  isStreaming,
  showIcon,
}: {
  step: ThinkingStep;
  showConnector: boolean;
  isStreaming: boolean;
  showIcon: boolean;
}) {
  switch (step.kind) {
    case 'reasoning':
      return (
        <StepLayout
          showIcon={showIcon}
          showConnector={showConnector}
          icon={Brain}
        >
          <p
            className={cn(
              'whitespace-pre-wrap break-words line-clamp-3',
              isStreaming
                ? 'text-sm text-foreground'
                : 'text-xs text-muted-foreground',
            )}
          >
            {step.text}
          </p>
        </StepLayout>
      );
    case 'thinking-status':
      if (step.toolPart) {
        return (
          <ToolStep
            part={step.toolPart}
            showConnector={showConnector}
            showIcon={showIcon}
            label={step.text}
          />
        );
      }
      return (
        <StepLayout
          showIcon={showIcon}
          showConnector={showConnector}
          icon={Clock}
        >
          <Show
            when={isStreaming}
            fallback={
              <p className="text-xs text-muted-foreground">{step.text}</p>
            }
          >
            <TextShimmer class="text-sm" duration={3}>
              {step.text}
            </TextShimmer>
          </Show>
        </StepLayout>
      );
    case 'tool':
      return (
        <ToolStep
          part={step.part}
          showConnector={showConnector}
          showIcon={showIcon}
        />
      );
  }
}

function StepLayout({
  showIcon,
  showConnector,
  icon: Icon,
  children,
}: {
  showIcon: boolean;
  showConnector: boolean;
  icon: any;
  children: JSX.Element;
}) {
  return (
    <div className="flex gap-3">
      <Show when={showIcon}>
        <div className="flex flex-col items-center shrink-0">
          <div className="flex items-center justify-center size-5 rounded-full bg-muted">
            <Icon class="size-3 text-muted-foreground" />
          </div>
          <Show when={showConnector}>
            <div className="w-px flex-1 bg-border min-h-3" />
          </Show>
        </div>
      </Show>
      <div className="flex-1 min-w-0 pb-4 pt-0.5">{children}</div>
    </div>
  );
}

function ToolStep({
  part,
  showConnector,
  showIcon,
  label,
}: {
  part: AnyToolPart;
  showConnector: boolean;
  showIcon: boolean;
  label?: string;
}) {
  const status = chatPartUtils.deriveToolStatus(part);
  const icon =
    status === 'running' ? Loader2 : status === 'failed' ? XCircle : Wrench;

  return (
    <StepLayout showIcon={showIcon} showConnector={showConnector} icon={icon}>
      <ToolCard part={part} label={label} />
    </StepLayout>
  );
}

function ToolCard({ part, label }: { part: AnyToolPart; label?: string }) {
  const [detailsOpen, setDetailsOpen] = createSignal(false);
  const input = isObject(part.input) ? part.input : undefined;
  const output = chatPartUtils.extractToolOutputText(part);
  const hasInput = input && Object.keys(input).length > 0;
  const hasOutput = Boolean(output);
  const hasDetails = hasInput || hasOutput;
  const parsedOutput = createMemo(() =>
    detailsOpen && output ? tryParseJson(output) : undefined,
  );
  const pieceNames = createMemo(() => chatPartUtils.extractPieceNames(input));
  const { summaries: pieceSummaries } = piecesHooks.usePieceSummariesByNames({
    names: pieceNames,
  });
  const summary = buildToolSummary({ part });
  const displayLabel = label ?? summary.label;
  const primaryPiece = pieceSummaries.find((p) => p.logoUrl);

  return (
    <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1',
          hasDetails && 'cursor-pointer hover:bg-muted/50 transition-colors',
        )}
        onClick={() => hasDetails && setDetailsOpen(!detailsOpen)}
      >
        <Show
          when={primaryPiece}
          fallback={
            <summary.icon class="size-3 text-muted-foreground shrink-0" />
          }
        >
          <PieceIcon
            displayName={primaryPiece.displayName}
            logoUrl={primaryPiece.logoUrl!}
            size="xxs"
            border={false}
            showTooltip={false}
          />
        </Show>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {displayLabel}
        </span>
        <Show when={hasDetails}>
          <ChevronDown
            class={cn(
              'size-3 shrink-0 text-muted-foreground/50 transition-transform',
              detailsOpen && 'rotate-180',
            )}
          />
        </Show>
      </div>
      <Show when={hasDetails}>
        <CollapsibleContent class="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="mt-1.5 space-y-1.5 text-[11px]">
            <Show when={hasInput && input}>
              <div>
                <p className="text-muted-foreground font-medium mb-0.5">
                  {t('Input')}
                </p>
                <SimpleJsonViewer
                  data={input}
                  hideCopyButton={true}
                  maxHeight={100}
                  fontSize="11px"
                />
              </div>
            </Show>
            <Show when={hasOutput && parsedOutput !== undefined}>
              <div>
                <p className="text-muted-foreground font-medium mb-0.5">
                  {t('Output')}
                </p>
                <SimpleJsonViewer
                  data={parsedOutput}
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
  icon: any;
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
