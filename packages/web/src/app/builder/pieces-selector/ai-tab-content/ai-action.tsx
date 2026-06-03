import { FlowActionType, FlowTriggerType } from '@activepieces/shared';

import { CardListItem } from '@/components/custom/card-list';
import {
  PieceIcon,
  PieceSelectorItem,
  StepMetadataWithSuggestions,
} from '@/features/pieces';

type AIActionItemProps = {
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

const AIActionItem = (props: AIActionItemProps) => {
  const pieceSelectorItemInfo = getPieceSelectorItemInfo(props.item);

  return (
    <CardListItem
      class="p-4 w-full h-full rounded-md flex flex-col justify-between h-[125px]"
      onClick={props.onClick}
    >
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-center">
          <PieceIcon
            logoUrl={props.stepMetadataWithSuggestions.logoUrl}
            displayName={props.stepMetadataWithSuggestions.displayName}
            showTooltip={false}
            size={'lg'}
          />
        </div>
        <div class="flex flex-col gap-1 text-center">
          <div class="text-sm font-medium leading-tight">
            {pieceSelectorItemInfo.displayName}
          </div>
        </div>
      </div>
    </CardListItem>
  );
};

export default AIActionItem;
