import {
  type AgentResult,
  AgentTaskStatus,
  ContentBlockType,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { For, Match, Show, Switch, mergeProps } from 'solid-js';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import {
  AgentToolBlock,
  DoneBlock,
  FailedBlock,
  MarkdownBlock,
  PromptBlock,
  StructuredOutputBlock,
  ThinkingBlock,
} from './timeline-blocks';

type AgentTimelineProps = {
  className?: string;
  agentResult?: AgentResult;
};

export const AgentTimeline = (_props: AgentTimelineProps) => {
  const props = mergeProps({ className: '' }, _props);

  return (
    <Show
      when={props.agentResult}
      fallback={<p>{t('No agent output available')}</p>}
    >
      {(result) => (
        <div class={cn('h-full flex w-full flex-col', props.className)}>
          <ScrollArea class="flex-1 min-h-0 relative">
            <div class="absolute left-2 top-4 bottom-8 w-px bg-border" />

            <div class="space-y-7 pb-4">
              <Show when={result().prompt.length > 0}>
                <PromptBlock prompt={result().prompt} />
              </Show>

              <For each={result().steps}>
                {(step, index) => (
                  <Switch>
                    <Match when={step.type === ContentBlockType.MARKDOWN}>
                      <MarkdownBlock step={step} index={index()} />
                    </Match>
                    <Match when={step.type === ContentBlockType.TOOL_CALL}>
                      <AgentToolBlock block={step} index={index()} />
                    </Match>
                  </Switch>
                )}
              </For>

              <Show when={!isNil(result().structuredOutput)}>
                <StructuredOutputBlock output={result().structuredOutput} />
              </Show>

              <Show when={result().status === AgentTaskStatus.IN_PROGRESS}>
                <ThinkingBlock />
              </Show>
              <Show when={result().status === AgentTaskStatus.COMPLETED}>
                <DoneBlock />
              </Show>
              <Show when={result().status === AgentTaskStatus.FAILED}>
                <FailedBlock />
              </Show>
            </div>
          </ScrollArea>
        </div>
      )}
    </Show>
  );
};
