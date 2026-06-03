import { AgentPieceTool, mcpToolNameUtils } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus, Puzzle, X } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { stepsHooks } from '@/features/pieces/hooks/steps-hooks';
import { PieceStepMetadataWithSuggestions } from '@/features/pieces/types';

import { usePieceToolsDialogStore } from '../stores/pieces-tools';

type AgentPieceToolProps = {
  disabled?: boolean;
  tools: AgentPieceTool[];
  removeTool: (toolName: string) => void;
};

export const AgentPieceToolComponent = (props: AgentPieceToolProps) => {
  const { openAddPieceToolDialog } = usePieceToolsDialogStore();

  const steps = stepsHooks.useAllStepsMetadata({
    searchQuery: '',
    type: 'action',
  });
  const metadata = steps.metadata as unknown as
    | PieceStepMetadataWithSuggestions[]
    | undefined;

  const piecesMetadata = createMemo(() => {
    return metadata?.filter(
      (m): m is PieceStepMetadataWithSuggestions =>
        'suggestedActions' in m && 'suggestedTriggers' in m,
    );
  });

  const pieceMetadata = createMemo(() =>
    piecesMetadata()?.find(
      (p) => p.pieceName === props.tools[0]?.pieceMetadata.pieceName,
    ),
  );

  const handleEditTool = (tool: AgentPieceTool) => {
    openAddPieceToolDialog({ page: 'action-inputs', tool });
  };

  const toolName = (tool: AgentPieceTool) =>
    pieceMetadata()?.suggestedActions?.find(
      (action) =>
        mcpToolNameUtils.createPieceToolName(
          pieceMetadata()?.pieceName ?? '',
          action.name,
        ) === tool.toolName,
    )?.displayName;

  return (
    <Show
      when={pieceMetadata()}
      fallback={
        <div class="flex  w-full items-center justify-between px-3 h-12  border-b last:border-0 py-2">
          <div class="flex items-center gap-3">
            <Skeleton class="h-6 w-6 rounded-md" />
            <Skeleton class="h-4 w-32" />
          </div>

          <Skeleton class="h-4 w-4 rounded-sm" />
        </div>
      }
    >
      {(piece) => (
        <AccordionItem value={piece().pieceName} class="border-b last:border-0">
          <AccordionTrigger class="px-4 py-3 hover:no-underline hover:bg-accent transition-all">
            <div class="flex w-full items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                  <Show
                    when={piece().logoUrl}
                    fallback={<Puzzle class="h-5 w-5 text-muted-foreground" />}
                  >
                    <img
                      src={piece().logoUrl}
                      alt={piece().displayName}
                      class="h-5 w-5 object-contain"
                    />
                  </Show>
                </div>

                <span class="text-sm font-medium">{piece().displayName}</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 py-2">
            <div class="flex flex-wrap gap-2">
              <For each={props.tools}>
                {(tool) => {
                  return (
                    <div
                      onClick={() => handleEditTool(tool)}
                      class={`
                  group flex items-center gap-2 px-3 py-1 cursor-pointer
                  rounded-full border bg-muted/50
                  ${props.disabled ? 'opacity-50 pointer-events-none' : ''}
                `}
                    >
                      <span class="text-xs font-medium">
                        {toolName(tool) || tool.toolName}
                      </span>

                      <div class="flex items-center gap-1">
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
                          <TooltipContent>{t('Remove tool')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
            <Button
              variant="link"
              class="mt-4"
              size="xs"
              onClick={() =>
                openAddPieceToolDialog({
                  page: 'actions-list',
                  piece: piece(),
                })
              }
            >
              <Plus class="size-3 mr-1" />
              {t('Add Action')}
            </Button>
          </AccordionContent>
        </AccordionItem>
      )}
    </Show>
  );
};
