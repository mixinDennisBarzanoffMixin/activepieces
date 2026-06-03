import { FlowOperationType } from '@activepieces/shared';
import { For, Show, createMemo, untrack } from 'solid-js';

import {
  CardListItem,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PieceIcon,
  PieceSelectorTabType,
  usePieceSelectorTabs,
  PieceSelectorOperation,
  CategorizedStepMetadataWithSuggestions,
} from '@/features/pieces';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';

const ExploreTabContent = (props: { operation: PieceSelectorOperation }) => {
  const operation = createMemo(() => props.operation);
  const { selectedTab, selectedPieceInExplore, setSelectedPieceInExplore } =
    usePieceSelectorTabs();
  const usePiecesSearch = piecesHooks.usePiecesSearch as PiecesSearch;
  const { data: categories, isLoading: isLoadingPieces } = usePiecesSearch({
    shouldCaptureEvent: false,
    searchQuery: '',
    type:
      untrack(operation).type === FlowOperationType.UPDATE_TRIGGER
        ? 'trigger'
        : 'action',
  });

  return (
    <Show when={selectedTab === PieceSelectorTabType.EXPLORE}>
      <Show
        when={!isLoadingPieces}
        fallback={
          <div class="flex flex-col gap-2 w-full">
            <CardListItemSkeleton numberOfCards={2} withCircle={false} />
          </div>
        }
      >
        <Show
          when={!selectedPieceInExplore}
          fallback={
            <div class="w-full">
              <PieceActionsOrTriggersList
                stepMetadataWithSuggestions={selectedPieceInExplore}
                hidePieceIconAndDescription={false}
                operation={operation()}
              />
            </div>
          }
        >
          <ScrollArea class="h-full w-full">
            <div class="flex  p-2  ">
              <For each={categories}>
                {(category) => (
                  <div class="flex w-[50%] flex-col gap-0.5 ">
                    <div class="text-sm text-muted-foreground mb-1.5">
                      {category.title}
                    </div>

                    <For each={category.metadata}>
                      {(pieceMetadata) => (
                        <CardListItem
                          class="rounded-sm py-3"
                          key={pieceMetadata.displayName}
                          onClick={() =>
                            setSelectedPieceInExplore(pieceMetadata)
                          }
                        >
                          <div class="flex gap-2 items-center h-full">
                            <PieceIcon
                              logoUrl={pieceMetadata.logoUrl}
                              displayName={pieceMetadata.displayName}
                              showTooltip={false}
                              size={'sm'}
                            />
                            <div class="grow h-full flex items-center justify-left text-sm">
                              {pieceMetadata.displayName}
                            </div>
                          </div>{' '}
                        </CardListItem>
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>
          </ScrollArea>
        </Show>
      </Show>
    </Show>
  );
};

export { ExploreTabContent };

type PiecesSearch = (props: {
  searchQuery: string;
  enabled?: boolean;
  type: 'action' | 'trigger';
  shouldCaptureEvent: boolean;
}) => {
  isLoading: boolean;
  data: CategorizedStepMetadataWithSuggestions[];
};
