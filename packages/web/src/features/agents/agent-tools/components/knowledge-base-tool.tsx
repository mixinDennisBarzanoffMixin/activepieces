import {
  AgentKnowledgeBaseTool,
  AgentTool,
  AIProviderName,
  KnowledgeBaseSourceType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { BookOpen, FileText, Table2, X } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PROVIDER_EMBEDDING_MODELS } from '@/features/agents';
import { cn } from '@/lib/utils';

import { AgentKnowledgeBaseDialog } from '../knowledge-base-dialog';
import { useKnowledgeBaseToolDialogStore } from '../stores/knowledge-base-tools';

import { AddKnowledgeBaseDropdown } from './add-knowledge-base-dropdown';

function KnowledgeBaseToolPills(props: {
  tools: AgentKnowledgeBaseTool[];
  disabled?: boolean;
  removeTool: (toolName: string) => void;
}) {
  const { setShowAddKbDialog } = useKnowledgeBaseToolDialogStore();

  return (
    <div class="flex flex-wrap gap-2">
      <For each={props.tools}>
        {(tool) => (
          <div
            onClick={() => setShowAddKbDialog(true, tool)}
            class={cn(
              'group flex items-center gap-2 px-3 py-1 cursor-pointer rounded-full border bg-muted/50',
              props.disabled && 'opacity-50 pointer-events-none',
            )}
          >
            <Show
              when={tool.sourceType === KnowledgeBaseSourceType.FILE}
              fallback={
                <Table2 class="size-3.5 text-muted-foreground shrink-0" />
              }
            >
              <FileText class="size-3.5 text-muted-foreground shrink-0" />
            </Show>
            <span class="text-xs font-medium max-w-40 truncate">
              {tool.sourceName}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={props.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    props.removeTool(tool.toolName);
                  }}
                  variant="ghost"
                  size="icon"
                  class="
                  size-5 p-0.5
                  text-muted-foreground
                  hover:text-destructive
                  hover:bg-destructive/10
                  transition
                "
                >
                  <X class="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Remove knowledge source')}</TooltipContent>
            </Tooltip>
          </div>
        )}
      </For>
    </div>
  );
}

export const KnowledgeBaseSection = (props: KnowledgeBaseSectionProps) => {
  const embeddingModel = props.selectedProvider
    ? PROVIDER_EMBEDDING_MODELS[props.selectedProvider]
    : undefined;
  const supportsEmbeddings = !!embeddingModel;

  return (
    <div class="mt-6">
      <h2 class="text-sm font-medium">{t('Knowledge Base')}</h2>

      <div class="mt-2">
        <Show
          when={props.tools.length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-4 py-8 text-center">
              <div class="flex items-center justify-center h-10 w-10 rounded-full border bg-background">
                <BookOpen class="size-5" />
              </div>
              <Show
                when={supportsEmbeddings}
                fallback={
                  <p class="text-sm text-muted-foreground">
                    {t(
                      'Knowledge base requires a provider that supports embeddings, such as OpenAI or Google.',
                    )}
                  </p>
                }
              >
                <>
                  <p class="text-sm font-medium text-muted-foreground">
                    {t(
                      'Add files or tables as knowledge sources for your agent.',
                    )}
                  </p>
                  <AddKnowledgeBaseDropdown disabled={props.disabled} />
                </>
              </Show>
            </div>
          }
        >
          <div class="border rounded-md overflow-hidden p-4">
            <KnowledgeBaseToolPills
              tools={props.tools}
              disabled={props.disabled}
              removeTool={props.removeTool}
            />

            <Show
              when={supportsEmbeddings}
              fallback={
                <p class="text-xs text-muted-foreground mt-3">
                  {t(
                    'The selected provider does not support embeddings. Switch to a provider like OpenAI or Google for knowledge base to work.',
                  )}
                </p>
              }
            >
              <div class="mt-4">
                <AddKnowledgeBaseDropdown disabled={props.disabled} />
              </div>
            </Show>
          </div>
        </Show>
      </div>

      <AgentKnowledgeBaseDialog
        tools={props.allTools}
        onToolsUpdate={props.onToolsUpdate}
      />
    </div>
  );
};

type KnowledgeBaseSectionProps = {
  disabled?: boolean;
  tools: AgentKnowledgeBaseTool[];
  allTools: AgentTool[];
  removeTool: (toolName: string) => void;
  onToolsUpdate: (tools: AgentTool[]) => void;
  selectedProvider?: AIProviderName;
};
