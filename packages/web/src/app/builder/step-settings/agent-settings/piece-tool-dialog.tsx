import { AgentTool, isNil, mcpToolNameUtils } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronLeft } from 'lucide-solid';
import { Show, createEffect, createMemo } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PieceActionsList,
  PiecesList,
  usePieceToolsDialogStore,
} from '@/features/agents';
import {
  stepsHooks,
  PieceStepMetadataWithSuggestions,
  StepMetadataWithSuggestions,
} from '@/features/pieces';
import { useDebounce } from '@/lib/debounce';

import { PredefinedInputsForm } from './predefined-inputs-form';

type AgentToolsDialogProps = {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
};

const excludedPieces = [
  '@activepieces/piece-ai',
  '@activepieces/piece-mcp',
  '@activepieces/piece-openai',
  '@activepieces/piece-claude',
  '@activepieces/piece-google-gemini',
  '@activepieces/piece-grok-xai',
];

export function AgentPieceDialog(props: AgentToolsDialogProps) {
  const {
    showAddPieceDialog,
    selectedPage,
    searchQuery,
    selectedAction,
    isPieceAuthSet,
    selectedPiece,
    editingPieceTool,
    createNewPieceTool,
    goBackToActionsList,
    handlePieceSelect,
    handleActionSelect,
    goBackToPiecesList,
    closePieceDialog,
  } = usePieceToolsDialogStore();

  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const { metadata, isLoading: isPiecesLoading } =
    stepsHooks.useAllStepsMetadata({
      searchQuery: debouncedQuery,
      type: 'action',
    }) as {
      metadata: StepMetadataWithSuggestions[] | undefined;
      isLoading: boolean;
    };

  const pieceMetadata = createMemo(() => {
    return (
      metadata
        ?.filter(
          (m): m is PieceStepMetadataWithSuggestions =>
            'suggestedActions' in m && 'suggestedTriggers' in m,
        )
        .filter((piece) => !excludedPieces.includes(piece.pieceName)) ?? []
    );
  });

  createEffect(() => {
    if (!showAddPieceDialog) return;
    if (!isNil(editingPieceTool) && pieceMetadata().length > 0) {
      const piece = pieceMetadata().find(
        (p) => p.pieceName === editingPieceTool.pieceMetadata.pieceName,
      );

      if (piece) {
        handlePieceSelect(piece);
        const action = piece.suggestedActions?.find((a) => {
          return (
            mcpToolNameUtils.createPieceToolName(piece.pieceName, a.name) ===
            editingPieceTool.toolName
          );
        });
        if (action) {
          handleActionSelect(action);
        }
      }
    }
  });

  const authIsSetValue = isPieceAuthSet();

  const handleSave = () => {
    const newTool = createNewPieceTool();
    if (isNil(newTool)) return;

    if (!isNil(editingPieceTool)) {
      const updatedTools = props.tools.map((tool) =>
        tool.toolName === editingPieceTool.toolName ? newTool : tool,
      );
      props.onToolsUpdate(updatedTools);
      toast('Piece tool updated');
    } else {
      props.onToolsUpdate([...props.tools, newTool]);
      toast('Piece tool added');
    }

    closePieceDialog();
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      closePieceDialog();
    }
  };

  const renderDialogMainContent = () => {
    switch (selectedPage) {
      case 'pieces-list': {
        return (
          <PiecesList
            isPiecesLoading={isPiecesLoading}
            pieceMetadata={pieceMetadata()}
          />
        );
      }
      case 'actions-list': {
        return <PieceActionsList tools={props.tools} />;
      }
      case 'action-inputs': {
        return <PredefinedInputsForm />;
      }
    }
  };

  const renderDialogHeaderContent = () => {
    switch (selectedPage) {
      case 'pieces-list': {
        return t('Connect apps with the agent');
      }
      case 'actions-list': {
        return (
          selectedPiece && (
            <div class="flex items-center justify-start gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBackToPiecesList}
                  >
                    <ChevronLeft class="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Back')}</TooltipContent>
              </Tooltip>
              {t(selectedPiece.displayName)}
            </div>
          )
        );
      }
      case 'action-inputs': {
        return (
          selectedAction && (
            <div class="flex items-center justify-start gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBackToActionsList}
                  >
                    <ChevronLeft class="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Back')}</TooltipContent>
              </Tooltip>
              {selectedAction.displayName}
            </div>
          )
        );
      }
    }
  };

  return (
    <Dialog open={showAddPieceDialog} onOpenChange={handleDialogClose}>
      <DialogContent class="w-[90vw] max-w-[750px] h-[80vh] max-h-[800px] flex flex-col overflow-hidden p-0">
        <DialogHeader class="min-h-16 flex px-4 items-start justify-center mb-0 border-b">
          <DialogTitle>{renderDialogHeaderContent()}</DialogTitle>
        </DialogHeader>

        {renderDialogMainContent()}

        <Show when={selectedPage === 'action-inputs'}>
          <DialogFooter class="border-t p-4 mt-auto">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t('Close')}
              </Button>
            </DialogClose>
            <Button
              loading={false}
              disabled={!authIsSetValue}
              type="button"
              onClick={handleSave}
            >
              <Show when={editingPieceTool} fallback={t('Add Tool')}>
                {t('Update Tool')}
              </Show>
            </Button>
          </DialogFooter>
        </Show>
      </DialogContent>
    </Dialog>
  );
}
