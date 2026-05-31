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
import { createMemo, createSignal } from 'solid-js';

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

const parseJsonOrReturnOriginal = (json: unknown) => {
  try {
    return JSON.parse(json as string);
  } catch {
    return json;
  }
};

const TimelineItem = ({
  icon,
  children,
  iconLeft = 'left-0',
}: {
  icon: any;
  children: any;
  iconLeft?: string;
}) => {
  return (
    <div className="relative pl-7 animate-fade">
      <div
        className={`absolute bg-background ${iconLeft} w-4 h-4 top-3.5 flex items-center justify-center`}
      >
        {icon}
      </div>

      {children}
    </div>
  );
};

export const AgentToolBlock = ({ block, index }: AgentToolBlockProps) => {
  if ([TASK_COMPLETION_TOOL_NAME].includes(block.toolName ?? '')) return null;

  const { data: metadata, isLoading } = agentToolHooks.useToolMetadata(block);

  const output = normalizeToolOutputToExecuteResponse(block.output);
  const errorMessage = (output.errorMessage as string) ?? null;
  const isDone = block.status === ToolCallStatus.COMPLETED;
  const isSuccess = output.status;
  const hasInstructions = !isNil(block.input?.instruction);
  const resolvedFields =
    (Object.keys(output.resolvedInput ?? {}).length > 0
      ? output.resolvedInput
      : null) ??
    (Object.keys(block.input ?? {}).length > 0 ? block.input : null);
  const result =
    output.output != null ? parseJsonOrReturnOriginal(output.output) : null;

  const defaultTab = resolvedFields ? 'resolvedFields' : 'result';

  const renderStatusIcon = () => {
    if (!isDone) return <Loader2 class="h-4 w-4 animate-spin shrink-0" />;
    return isSuccess === ExecutionToolStatus.SUCCESS ? (
      <CheckCheck class="h-4 w-4 text-success shrink-0" />
    ) : (
      <CircleX class="h-4 w-4 text-destructive shrink-0" />
    );
  };

  const renderToolIcon = () => {
    if (isLoading) return <Loader2 class="h-4 w-4 animate-spin shrink-0" />;
    if (metadata?.iconType === 'knowledge-base')
      return <BookOpen class="h-4 w-4 shrink-0" />;
    if (metadata?.logoUrl)
      return (
        <img
          src={metadata.logoUrl}
          alt="Tool logo"
          className="h-4 w-4 object-contain shrink-0"
        />
      );
    return <Wrench class="h-4 w-4 shrink-0" />;
  };

  const ToolHeader = (
    <div className="flex items-center gap-2 w-full">
      {renderToolIcon()}
      <span
        className={`flex gap-1 items-center ${
          !isSuccess ? 'text-destructive' : ''
        }`}
      >
        <span className="text-sm font-semibold">
          {isLoading ? 'Loading...' : metadata?.displayName ?? 'Unknown Tool'}
          {!isSuccess && t(' (Failed)')}
        </span>
      </span>
    </div>
  );

  return (
    <TimelineItem key={`step-${index}-${block.type}`} icon={renderStatusIcon()}>
      <Accordion
        type="single"
        collapsible
        class="w-full bg-accent/20 rounded-md text-foreground border border-border"
      >
        <AccordionItem value={`block-${index}`} class="border-0">
          <AccordionTrigger class="p-3 text-sm">{ToolHeader}</AccordionTrigger>

          <AccordionContent>
            <div className="space-y-3 w-full my-2">
              {hasInstructions && (
                <ApMarkdown
                  variant={MarkdownVariant.BORDERLESS}
                  markdown={block.input?.instruction as string}
                />
              )}

              {!isLoading && (
                <Tabs defaultValue={defaultTab} class="w-full">
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
                      {isNil(errorMessage) ? t('Output') : t('Error')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="resolvedFields"
                    class="overflow-hidden mt-3"
                  >
                    {resolvedFields ? (
                      <DataList data={resolvedFields} />
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        {t('No resolved fields')}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="result" class="overflow-hidden mt-3">
                    {result ? (
                      <SimpleJsonViewer
                        data={result}
                        hideCopyButton
                        maxHeight={300}
                      />
                    ) : !isNil(errorMessage) ? (
                      <ApMarkdown
                        variant={MarkdownVariant.BORDERLESS}
                        markdown={errorMessage}
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        {t('No result')}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </TimelineItem>
  );
};

export const MarkdownBlock = ({
  index,
  step,
}: {
  index: number;
  step: MarkdownContentBlock;
}) => {
  return (
    <TimelineItem
      key={`step-${index}-${step.type}`}
      icon={<MessageSquareText class="h-4 w-4 text-muted-foreground" />}
    >
      <div className="bg-accent/20 rounded-md p-3 text-sm text-foreground border border-border">
        <ApMarkdown
          markdown={step.markdown}
          variant={MarkdownVariant.BORDERLESS}
        />
      </div>
    </TimelineItem>
  );
};

export const StructuredOutputBlock = ({ output }: { output: any }) => {
  return (
    <TimelineItem icon={<Braces class="h-4 w-4 text-muted-foreground" />}>
      <JsonViewer json={output} title={t('output')} />
    </TimelineItem>
  );
};

export const ThinkingBlock = () => {
  return (
    <TimelineItem
      icon={<Loader2 class="h-4 w-4 text-muted-foreground animate-spin" />}
    >
      <div className="bg-accent/20 rounded-md p-3 w-full text-sm text-foreground border border-border animate-pulse">
        <span>{t('Agent is thinking...')}</span>
      </div>
    </TimelineItem>
  );
};

export const PromptBlock = ({ prompt }: { prompt: string }) => {
  const MAX_CHARS = 180;
  const [expanded, setExpanded] = createSignal(false);

  const isTruncatable = prompt.length > MAX_CHARS;

  const displayedPrompt = createMemo(() => {
    if (expanded || !isTruncatable) return prompt;
    return prompt.slice(0, MAX_CHARS) + '…';
  });

  return (
    <TimelineItem icon={<SquareTerminal class="h-4 w-4 text-primary" />}>
      <div className="bg-primary/5 rounded-md p-3 text-sm text-foreground border border-border space-y-2">
        <ApMarkdown
          markdown={displayedPrompt}
          variant={MarkdownVariant.BORDERLESS}
        />

        {isTruncatable && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-primary hover:underline"
          >
            {expanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>
    </TimelineItem>
  );
};

export const DoneBlock = () => {
  return (
    <TimelineItem icon={<CircleCheckBig class="h-4 w-4 text-success-600" />}>
      <div className="border border-success/40 bg-success-50/60 rounded-md p-3 text-sm text-success-700 font-medium flex items-center gap-2">
        <span>{t('Done!')}</span>
      </div>
    </TimelineItem>
  );
};

export const FailedBlock = () => {
  return (
    <TimelineItem icon={<CircleX class="h-4 w-4 text-destructive-600" />}>
      <div className="border border-destructive/40 bg-destructive-50/60 rounded-md p-3 text-sm text-destructive-700 font-medium flex items-center gap-2">
        <span>{t('Failed')}</span>
      </div>
    </TimelineItem>
  );
};
