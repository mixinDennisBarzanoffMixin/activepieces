import { untrack } from 'solid-js';

import { piecesHooks } from '../hooks/pieces-hooks';

type PieceDisplayNameProps = {
  pieceName: string;
  fallback?: string;
};

const PieceDisplayName = (props: PieceDisplayNameProps) => {
  const { summary } = piecesHooks.usePieceSummary({
    name: untrack(() => props.pieceName),
  });

  return (
    <span>{summary.displayName || props.fallback || props.pieceName}</span>
  );
};

export { PieceDisplayName };
