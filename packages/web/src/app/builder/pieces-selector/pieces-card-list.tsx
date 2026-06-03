import {
  FlowActionType,
  FlowOperationType,
  FlowTriggerType,
} from '@activepieces/shared';
import { Show, createMemo, createSignal, untrack } from 'solid-js';

import { CardListItemSkeleton } from '@/components/custom/card-list';
import { Separator } from '@/components/ui/separator';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
  CategorizedStepMetadataWithSuggestions,
  PIECE_SELECTOR_ELEMENTS_HEIGHTS,
  pieceSelectorUtils,
} from '@/features/pieces';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { useIsMobile } from '@/hooks/use-mobile';

import { cn } from '../../../lib/utils';
import { useBuilderStateContext } from '../builder-hooks';

import { NoResultsFound } from './no-results-found';
import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';
import { PieceCardListItem } from './piece-card-item';

type PiecesCardListProps = {
  searchQuery: string;
  operation: PieceSelectorOperation;
  stepToReplacePieceDisplayName?: string;
};

export const PiecesCardList = (props: PiecesCardListProps) => {
  const isMobile = useIsMobile();
  const searchQuery = createMemo(() => props.searchQuery);
  const operation = createMemo(() => props.operation);
  const stepToReplace = createMemo(() => props.stepToReplacePieceDisplayName);
  const [selectedPieceMetadataInPieceSelector] = useBuilderStateContext(
    (state) => [state.selectedPieceMetadataInPieceSelector],
  );
  const usePiecesSearch = piecesHooks.usePiecesSearch as PiecesSearch;
  const { isLoading: isLoadingPieces, data: categories } = usePiecesSearch({
    shouldCaptureEvent: true,
    searchQuery: untrack(searchQuery),
    type:
      untrack(operation).type === FlowOperationType.UPDATE_TRIGGER
        ? 'trigger'
        : 'action',
  });

  const noResultsFound = () => !isLoadingPieces && categories.length === 0;
  const [mouseMoved, setMouseMoved] = createSignal(false);
  const showActionsOrTriggersInsidePiecesList = () =>
    searchQuery().length > 0 || isMobile;
  const virtualizedItems = createMemo(() =>
    transformPiecesMetadataToVirtualizedItems(
      categories,
      showActionsOrTriggersInsidePiecesList(),
    ),
  );

  const initialIndexToScrollToInPiecesList = () =>
    virtualizedItems().findIndex(
      (item) => item.displayName === stepToReplace(),
    );
  const { selectedTab } = usePieceSelectorTabs();

  const isLoading = () => isLoadingPieces;
  const showActionsOrTriggersList = () =>
    searchQuery().length === 0 &&
    !isMobile &&
    !noResultsFound() &&
    !isLoading();
  const showPiecesList = () => !noResultsFound() && !isLoading();
  const showList = () =>
    ![
      PieceSelectorTabType.EXPLORE,
      PieceSelectorTabType.AI_AND_AGENTS,
      PieceSelectorTabType.APPROVALS,
    ].includes(selectedTab);
  return (
    <Show when={showList()}>
      <>
        <div
          onMouseMove={() => {
            setMouseMoved(!isLoadingPieces);
          }}
          class={cn('w-full md:w-[250px] md:min-w-[250px] transition-all ', {
            'w-full md:w-full': searchQuery().length > 0 || noResultsFound(),
          })}
        >
          <Show when={isLoading()}>
            <div class="flex flex-col gap-2">
              <CardListItemSkeleton numberOfCards={2} withCircle={false} />
            </div>
          </Show>

          <Show when={showPiecesList()}>
            <VirtualizedScrollArea
              key={`${selectedTab}-${searchQuery()}`}
              initialScroll={{
                index: initialIndexToScrollToInPiecesList(),
                clickAfterScroll: true,
              }}
              items={virtualizedItems()}
              estimateSize={(index) => virtualizedItems()[index].height}
              getItemKey={(index) => virtualizedItems()[index].id}
              renderItem={(item) => {
                if (item.isCategory) {
                  return (
                    <div
                      class={cn('p-2 pb-0 text-sm text-muted-foreground')}
                      id={item.displayName}
                    >
                      {item.displayName}
                    </div>
                  );
                }
                return (
                  <PieceCardListItem
                    pieceMetadata={item.pieceMetadata}
                    searchQuery={searchQuery()}
                    operation={operation()}
                    isTemporaryDisabledUntilNextCursorMove={!mouseMoved}
                  />
                );
              }}
            />
          </Show>

          <Show when={noResultsFound()}>
            <NoResultsFound />
          </Show>
        </div>

        <Show when={showActionsOrTriggersList()}>
          <>
            <Separator orientation="vertical" class="h-full" />
            <PieceActionsOrTriggersList
              stepMetadataWithSuggestions={selectedPieceMetadataInPieceSelector}
              hidePieceIconAndDescription={false}
              operation={operation()}
            />
          </>
        </Show>
      </>
    </Show>
  );
};

type VirtualizedItem = {
  id: string;
  displayName: string;
  height: number;
} & (
  | {
      isCategory: true;
    }
  | {
      isCategory: false;
      pieceMetadata: StepMetadataWithSuggestions;
    }
);

type PiecesSearch = (props: {
  searchQuery: string;
  enabled?: boolean;
  type: 'action' | 'trigger';
  shouldCaptureEvent: boolean;
}) => {
  isLoading: boolean;
  data: CategorizedStepMetadataWithSuggestions[];
};

const transformPiecesMetadataToVirtualizedItems = (
  searchResult: CategorizedStepMetadataWithSuggestions[],
  showActionsOrTriggersInsidePiecesList: boolean,
) => {
  return searchResult.reduce<VirtualizedItem[]>((result, category) => {
    if (!showActionsOrTriggersInsidePiecesList) {
      result.push({
        id: category.title,
        displayName: category.title,
        height: PIECE_SELECTOR_ELEMENTS_HEIGHTS.CATEGORY_ITEM_HEIGHT,
        isCategory: true,
      });
    }
    category.metadata.forEach((pieceMetadata, index) => {
      result.push({
        id: `${pieceMetadata.displayName}-${index}`,
        height: getItemHeight(
          pieceMetadata,
          showActionsOrTriggersInsidePiecesList,
        ),
        isCategory: false,
        pieceMetadata,
        displayName: pieceMetadata.displayName,
      });
    });
    return result;
  }, []);
};

const getItemHeight = (
  pieceMetadata: StepMetadataWithSuggestions,
  showActionsOrTriggersInsidePiecesList: boolean,
) => {
  const { ACTION_OR_TRIGGER_ITEM_HEIGHT, PIECE_ITEM_HEIGHT } =
    PIECE_SELECTOR_ELEMENTS_HEIGHTS;
  if (
    pieceMetadata.type === FlowActionType.PIECE &&
    showActionsOrTriggersInsidePiecesList
  ) {
    const actionsListWithoutHiddenActions =
      pieceSelectorUtils.removeHiddenActions(pieceMetadata);
    return (
      ACTION_OR_TRIGGER_ITEM_HEIGHT *
        Object.values(actionsListWithoutHiddenActions).length +
      PIECE_ITEM_HEIGHT
    );
  }
  if (
    pieceMetadata.type === FlowTriggerType.PIECE &&
    showActionsOrTriggersInsidePiecesList
  ) {
    return (
      ACTION_OR_TRIGGER_ITEM_HEIGHT *
        Object.values(pieceMetadata.suggestedTriggers ?? {}).length +
      PIECE_ITEM_HEIGHT
    );
  }
  const isCoreAction =
    pieceMetadata.type === FlowActionType.CODE ||
    pieceMetadata.type === FlowActionType.LOOP_ON_ITEMS ||
    pieceMetadata.type === FlowActionType.ROUTER;
  if (isCoreAction && showActionsOrTriggersInsidePiecesList) {
    return ACTION_OR_TRIGGER_ITEM_HEIGHT + PIECE_ITEM_HEIGHT;
  }
  return PIECE_ITEM_HEIGHT;
};
