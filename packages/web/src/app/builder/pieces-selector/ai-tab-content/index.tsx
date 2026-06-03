import { FlowOperationType, isNil } from '@activepieces/shared';
import { Show } from 'solid-js';

import { CardListItemSkeleton } from '@/components/custom/card-list';
import {
  piecesHooks,
  PieceSelectorTabType,
  usePieceSelectorTabs,
  PieceSelectorOperation,
  stepUtils,
} from '@/features/pieces';

import { AIPieceActionsList } from './ai-actions-list';

const AITabContent = (props: { operation: PieceSelectorOperation }) => {
  const { selectedTab } = usePieceSelectorTabs();
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: '@activepieces/piece-ai',
  });

  return (
    <Show
      when={
        selectedTab === PieceSelectorTabType.AI_AND_AGENTS &&
        [
          FlowOperationType.ADD_ACTION,
          FlowOperationType.UPDATE_ACTION,
        ].includes(props.operation.type)
      }
    >
      <Show
        when={!isLoading && !isNil(pieceModel)}
        fallback={
          <div class="flex flex-col gap-2 w-full">
            <CardListItemSkeleton numberOfCards={2} withCircle={false} />
          </div>
        }
      >
        {() => {
          const meta = stepUtils.mapPieceToMetadata({
            piece: pieceModel,
            type: 'action',
          });

          const piece = {
            ...meta,
            suggestedActions: Object.values(pieceModel.actions),
            suggestedTriggers: Object.values(pieceModel.triggers),
          };

          return (
            <div class="w-full">
              <AIPieceActionsList
                stepMetadataWithSuggestions={piece}
                hidePieceIconAndDescription={false}
                operation={props.operation}
              />
            </div>
          );
        }}
      </Show>
    </Show>
  );
};

export { AITabContent };
