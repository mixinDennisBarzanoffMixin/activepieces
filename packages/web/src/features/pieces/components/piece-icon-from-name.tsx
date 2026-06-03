import { mergeProps, untrack } from 'solid-js';

import { piecesHooks } from '../hooks/pieces-hooks';

import { PieceIcon } from './piece-icon';

type PieceIconWithPieceNameProps = {
  pieceName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  showTooltip?: boolean;
};

const PieceIconWithPieceName = (_props: PieceIconWithPieceNameProps) => {
  const props = mergeProps(
    { size: 'md', border: true, showTooltip: true },
    _props,
  );
  const { summary } = piecesHooks.usePieceSummary({
    name: untrack(() => props.pieceName),
  });

  return (
    <PieceIcon
      size={props.size}
      border={props.border}
      displayName={summary()?.displayName}
      logoUrl={summary()?.logoUrl}
      showTooltip={props.showTooltip}
    />
  );
};

export { PieceIconWithPieceName };
