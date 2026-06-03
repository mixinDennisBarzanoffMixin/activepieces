import { FlowActionType, FlowTriggerType } from '@activepieces/shared';
import { Show } from 'solid-js';

import { CardListItem } from '@/components/custom/card-list';
import {
  PieceIcon,
  PieceSelectorItem,
  StepMetadataWithSuggestions,
  PIECE_SELECTOR_ELEMENTS_HEIGHTS,
} from '@/features/pieces';
import { cn } from '@/lib/utils';
type GenericActionOrTriggerItemProps = {
  item: PieceSelectorItem;
  hidePieceIconAndDescription: boolean;
  stepMetadataWithSuggestions: StepMetadataWithSuggestions;
  onClick: () => void;
};

const getPieceSelectorItemInfo = (item: PieceSelectorItem) => {
  if (
    item.type === FlowActionType.PIECE ||
    item.type === FlowTriggerType.PIECE
  ) {
    return {
      displayName: item.actionOrTrigger.displayName,
      description: item.actionOrTrigger.description,
    };
  }
  return {
    displayName: item.displayName,
    description: item.description,
  };
};

const GenericActionOrTriggerItem = (props: GenericActionOrTriggerItemProps) => {
  // we add this style because we hide the piece icon and description when they are in a virtualized list
  const style = props.hidePieceIconAndDescription
    ? {
        height: `${PIECE_SELECTOR_ELEMENTS_HEIGHTS.ACTION_OR_TRIGGER_ITEM_HEIGHT}px`,
        maxHeight: `${PIECE_SELECTOR_ELEMENTS_HEIGHTS.ACTION_OR_TRIGGER_ITEM_HEIGHT}px`,
      }
    : {
        minHeight: '54px',
      };
  const pieceSelectorItemInfo = getPieceSelectorItemInfo(props.item);
  return (
    <CardListItem
      class={cn('p-2 w-full ', {
        truncate: props.hidePieceIconAndDescription,
      })}
      onClick={props.onClick}
      style={style}
    >
      <div class="flex gap-3 items-center">
        <div
          classlist={{
            'opacity-0': props.hidePieceIconAndDescription,
          }}
        >
          <PieceIcon
            logoUrl={props.stepMetadataWithSuggestions.logoUrl}
            displayName={props.stepMetadataWithSuggestions.displayName}
            showTooltip={false}
            size={'sm'}
          />
        </div>
        <div class="flex flex-col gap-0.5">
          <div class="text-sm">{pieceSelectorItemInfo.displayName}</div>
          <Show when={!props.hidePieceIconAndDescription()}>
            <div class="text-xs text-muted-foreground">
              <Show
                when={pieceSelectorItemInfo.description.endsWith('.')}
                fallback={pieceSelectorItemInfo.description}
              >
                {pieceSelectorItemInfo.description.slice(0, -1)}
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </CardListItem>
  );
};

export default GenericActionOrTriggerItem;
