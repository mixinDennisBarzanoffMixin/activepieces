import { Card, CardContent } from '@/components/ui/card';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import { formatUtils } from '@/lib/format-utils';

type PieceCardProps = {
  pieceName: string;
};

export const PieceCard = (props: PieceCardProps) => {
  const { summary } = piecesHooks.usePieceSummary({ name: props.pieceName });

  return (
    <Card>
      <CardContent class="p-2 w-[165px] flex items-center gap-3">
        <PieceIconWithPieceName pieceName={props.pieceName} size="md" />
        <span class="text-sm font-medium">
          {summary.displayName ||
            formatUtils.convertEnumToHumanReadable(props.pieceName)}
        </span>
      </CardContent>
    </Card>
  );
};
