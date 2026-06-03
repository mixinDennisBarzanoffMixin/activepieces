import { Show } from 'solid-js';

import { CardListItem } from '@/components/custom/card-list';
import {
  PieceIcon,
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
  PIECE_SELECTOR_ELEMENTS_HEIGHTS,
} from '@/features/pieces';
import { useIsMobile } from '@/hooks/use-mobile';
import { wait } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';

type PieceCardListItemProps = {
  pieceMetadata: StepMetadataWithSuggestions;
  searchQuery: string;
  operation: PieceSelectorOperation;
  isTemporaryDisabledUntilNextCursorMove: boolean;
};

const PieceCardListItem = (props: PieceCardListItemProps) => {
  const isMobile = useIsMobile();
  const showSuggestions = props.searchQuery.length > 0 || isMobile;
  let isMouseOver = false;
  const selectPieceMetadata = async () => {
    if (props.isTemporaryDisabledUntilNextCursorMove || showSuggestions) {
      return;
    }
    isMouseOver = true;
    await wait(250);
    if (isMouseOver) {
      setSelectedPieceMetadataInPieceSelector(props.pieceMetadata);
    }
  };
  const [
    selectedPieceMetadataInPieceSelector,
    setSelectedPieceMetadataInPieceSelector,
  ] = useBuilderStateContext((state) => [
    state.selectedPieceMetadataInPieceSelector,
    state.setSelectedPieceMetadataInPieceSelector,
  ]);
  const itemHeight = PIECE_SELECTOR_ELEMENTS_HEIGHTS.PIECE_ITEM_HEIGHT;
  return (
    <>
      <CardListItem
        class={cn('flex-col p-3 gap-1 items-start truncate', {
          'hover:bg-transparent!': props.isTemporaryDisabledUntilNextCursorMove,
        })}
        style={{ height: `${itemHeight}px`, 'max-height': `${itemHeight}px` }}
        selected={
          selectedPieceMetadataInPieceSelector?.displayName ===
            props.pieceMetadata.displayName && props.searchQuery.length === 0
        }
        interactive={!showSuggestions}
        onMouseEnter={() => void selectPieceMetadata()}
        onMouseMove={() => void selectPieceMetadata()}
        onClick={() => {
          if (!showSuggestions) {
            setSelectedPieceMetadataInPieceSelector(props.pieceMetadata);
          }
        }}
        onMouseLeave={() => {
          isMouseOver = false;
        }}
        id={props.pieceMetadata.displayName}
        data-testid={props.pieceMetadata.displayName}
      >
        <div class="flex gap-2 items-center h-full">
          <PieceIcon
            logoUrl={props.pieceMetadata.logoUrl}
            displayName={props.pieceMetadata.displayName}
            showTooltip={false}
            size={'sm'}
          />
          <div class="grow h-full flex items-center justify-left text-sm">
            {props.pieceMetadata.displayName}
          </div>
        </div>
      </CardListItem>

      <Show when={showSuggestions}>
        <div>
          <PieceActionsOrTriggersList
            stepMetadataWithSuggestions={props.pieceMetadata}
            hidePieceIconAndDescription={true}
            operation={props.operation}
          />
        </div>
      </Show>
    </>
  );
};

export { PieceCardListItem };
