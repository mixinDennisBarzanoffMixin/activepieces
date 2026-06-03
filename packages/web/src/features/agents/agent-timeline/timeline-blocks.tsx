import {
  isNil,
  MarkdownContentBlock,
  MarkdownVariant,
  TASK_COMPLETION_TOOL_NAME,
  ToolCallStatus,
  ExecutionToolStatus,
  normalizeToolOutputToExecuteResponse,
  type ToolCallContentBlock,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  CircleX,
  Loader2,
  Wrench,
  BookOpen,
  MessageSquareText,
  CircleCheckBig,
  CheckCheck,
  SquareTerminal,
  Braces,
} from 'lucide-solid';
import {
  JSX,
  Show,
  createMemo,
  createSignal,
  mergeProps,
  untrack,
} from 'solid-js';

import { DataList } from '@/components/custom/data-list';
import { JsonViewer } from '@/components/custom/json-viewer';
import { ApMarkdown } from '@/components/custom/markdown';
import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { agentToolHooks } from '../agent-tool-hooks';

interface AgentToolBlockProps {
  block: ToolCallContentBlock;
  index: number;
}

const parseJsonOrReturnOriginal = (json: unknown): unknown => {
  if (typeof json !== 'string') {
    return json;
  }
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return json;
  }
};

const TimelineItem = (_props: {
  icon: JSX.Element;
  children: JSX.Element;
  iconLeft?: string;
}) => {
  const props = mergeProps({ iconLeft: 'left-0' }, _props);
  return (
    <div class="relative pl-7 animate-fade">
      <div
        class={`absolute bg-background ${props.iconLeft} w-4 h-4 top-3.5 flex items-center justify-center`}
      >
        {props.icon}
      </div>

      {props.children}
    </div>
  );
};

function getMetaString(meta: unknown, key: 'displayName' | 'logoUrl') {
  if (!hasMetaKey(meta, key)) {
    return null;
  }
  const value = meta[key];
  return typeof value === 'string' ? value : null;
}

function hasMetaKey(
  meta: unknown,
  key: 'displayName' | 'logoUrl',
): meta is Record<'displayName' | 'logoUrl', unknown> {
  return !!meta && typeof meta === 'object' && key in meta;
}

function isKnowledgeBaseMeta(meta: unknown) {
  return (
    !!meta &&
    typeof meta === 'object' &&
    'iconType' in meta &&
    meta.iconType === 'knowledge-base'
  );
}

export const AgentToolBlock = (props: AgentToolBlockProps) => {
  const block = untrack(() => props.block);
  const { data: metadata, isLoading } = agentToolHooks.useToolMetadata(block);

  const output = createMemo(() =>
    normalizeToolOutputToExecuteResponse(props.block.output),
  );
  const errorMessage = createMemo(() =>
    typeof output().errorMessage === 'string' ? output().errorMessage : null,
  );
  const isDone = createMemo(
    () => props.block.status === ToolCallStatus.COMPLETED,
  );
  const isSuccess = createMemo(() => output().status);
  const hasInstructions = createMemo(
    () => typeof props.block.input?.instruction === 'string',
  );
  const resolvedFields = createMemo(() => {
    if (Object.keys(output().resolvedInput).length > 0) {
      return output().resolvedInput;
    }
    if (props.block.input && Object.keys(props.block.input).length > 0) {
      return props.block.input;
    }
    return null;
  });
  const result = createMemo(() =>
    output().output != null ? parseJsonOrReturnOriginal(output().output) : null,
  );

  const defaultTab = createMemo(() =>
    resolvedFields() ? 'resolvedFields' : 'result',
  );

  const renderStatusIcon = () => {
    if (!isDone()) return <Loader2 class="h-4 w-4 animate-spin shrink-0" />;
    return isSuccess() === ExecutionToolStatus.SUCCESS ? (
      <CheckCheck class="h-4 w-4 text-success shrink-0" />
    ) : (
      <CircleX class="h-4 w-4 text-destructive shrink-0" />
    );
  };

  const renderToolIcon = () => {
    if (isLoading) return <Loader2 class="h-4 w-4 animate-spin shrink-0" />;
    if (isKnowledgeBaseMeta(metadata))
      return <BookOpen class="h-4 w-4 shrink-0" />;
    const logoUrl = getMetaString(metadata, 'logoUrl');
    if (logoUrl)
      return (
        <img
          src={logoUrl}
          alt="Tool logo"
          class="h-4 w-4 object-contain shrink-0"
        />
      );
    return <Wrench class="h-4 w-4 shrink-0" />;
  };

  const ToolHeader = (
    <div class="flex items-center gap-2 w-full">
      {renderToolIcon()}
      <span
        class={`flex gap-1 items-center ${
          isSuccess() !== ExecutionToolStatus.SUCCESS ? 'text-destructive' : ''
        }`}
      >
        <span class="text-sm font-semibold">
          {isLoading
            ? 'Loading...'
            : getMetaString(metadata, 'displayName') ?? 'Unknown Tool'}
          {isSuccess() !== ExecutionToolStatus.SUCCESS && t(' (Failed)')}
        </span>
      </span>
    </div>
  );

  return (
    <Show
      when={props.block.toolName !== TASK_COMPLETION_TOOL_NAME}
      keyed={false}
    >
      <TimelineItem
        key={`step-${props.index}-${props.block.type}`}
        icon={renderStatusIcon()}
      >
        <Accordion
          type="single"
          collapsible
          class="w-full bg-accent/20 rounded-md text-foreground border border-border"
        >
          <AccordionItem value={`block-${props.index}`} class="border-0">
            <AccordionTrigger class="p-3 text-sm">
              {ToolHeader}
            </AccordionTrigger>

            <AccordionContent>
              <div class="space-y-3 w-full my-2">
                <Show when={hasInstructions()}>
                  <ApMarkdown
                    variant={MarkdownVariant.BORDERLESS}
                    markdown={String(props.block.input?.instruction)}
                  />
                </Show>

                <Show when={!isLoading}>
                  <Tabs defaultValue={defaultTab()} class="w-full">
                    <TabsList variant="outline" class="mb-0">
                      <TabsTrigger
                        value="resolvedFields"
                        variant="outline"
                        class="text-xs"
                      >
                        {t('Parameters')}
                      </TabsTrigger>
                      <TabsTrigger
                        value="result"
                        variant="outline"
                        class="text-xs"
                      >
                        {isNil(errorMessage()) ? t('Output') : t('Error')}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="resolvedFields"
                      class="overflow-hidden mt-3"
                    >
                      <Show
                        when={resolvedFields()}
                        fallback={
                          <div class="text-muted-foreground text-sm">
                            {t('No resolved fields')}
                          </div>
                        }
                      >
                        <DataList data={resolvedFields()} />
                      </Show>
                    </TabsContent>

                    <TabsContent value="result" class="overflow-hidden mt-3">
                      <Show
                        when={result()}
                        fallback={
                          !isNil(errorMessage()) ? (
                            <ApMarkdown
                              variant={MarkdownVariant.BORDERLESS}
                              markdown={errorMessage() ?? ''}
                            />
                          ) : (
                            <div class="text-muted-foreground text-sm">
                              {t('No result')}
                            </div>
                          )
                        }
                      >
                        <SimpleJsonViewer
                          data={result()}
                          hideCopyButton
                          maxHeight={300}
                        />
                      </Show>
                    </TabsContent>
                  </Tabs>
                </Show>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TimelineItem>
    </Show>
  );
};

export const MarkdownBlock = (props: {
  index: number;
  step: MarkdownContentBlock;
}) => {
  return (
    <TimelineItem
      key={`step-${props.index}-${props.step.type}`}
      icon={<MessageSquareText class="h-4 w-4 text-muted-foreground" />}
    >
      <div class="bg-accent/20 rounded-md p-3 text-sm text-foreground border border-border">
        <ApMarkdown
          markdown={props.step.markdown}
          variant={MarkdownVariant.BORDERLESS}
        />
      </div>
    </TimelineItem>
  );
};

export const StructuredOutputBlock = (props: { output: unknown }) => {
  return (
    <TimelineItem icon={<Braces class="h-4 w-4 text-muted-foreground" />}>
      <JsonViewer json={props.output} title={String(t('output'))} />
    </TimelineItem>
  );
};

export const ThinkingBlock = () => {
  return (
    <TimelineItem
      icon={<Loader2 class="h-4 w-4 text-muted-foreground animate-spin" />}
    >
      <div class="bg-accent/20 rounded-md p-3 w-full text-sm text-foreground border border-border animate-pulse">
        <span>{t('Agent is thinking...')}</span>
      </div>
    </TimelineItem>
  );
};

export const PromptBlock = (props: { prompt: string }) => {
  const MAX_CHARS = 180;
  const [expanded, setExpanded] = createSignal(false);

  const isTruncatable = createMemo(() => props.prompt.length > MAX_CHARS);

  const displayedPrompt = createMemo(() => {
    if (expanded() || !isTruncatable()) return props.prompt;
    return props.prompt.slice(0, MAX_CHARS) + '…';
  });

  return (
    <TimelineItem icon={<SquareTerminal class="h-4 w-4 text-primary" />}>
      <div class="bg-primary/5 rounded-md p-3 text-sm text-foreground border border-border space-y-2">
        <ApMarkdown
          markdown={displayedPrompt()}
          variant={MarkdownVariant.BORDERLESS}
        />

        <Show when={isTruncatable()}>
          <button
            onClick={() => setExpanded((v) => !v)}
            class="text-xs text-primary hover:underline"
          >
            {expanded() ? 'Read less' : 'Read more'}
          </button>
        </Show>
      </div>
    </TimelineItem>
  );
};

export const DoneBlock = () => {
  return (
    <TimelineItem icon={<CircleCheckBig class="h-4 w-4 text-success-600" />}>
      <div class="border border-success/40 bg-success-50/60 rounded-md p-3 text-sm text-success-700 font-medium flex items-center gap-2">
        <span>{t('Done!')}</span>
      </div>
    </TimelineItem>
  );
};

export const FailedBlock = () => {
  return (
    <TimelineItem icon={<CircleX class="h-4 w-4 text-destructive-600" />}>
      <div class="border border-destructive/40 bg-destructive-50/60 rounded-md p-3 text-sm text-destructive-700 font-medium flex items-center gap-2">
        <span>{t('Failed')}</span>
      </div>
    </TimelineItem>
  );
};
