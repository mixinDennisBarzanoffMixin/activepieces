import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { Row } from '../types/types';

export function SelectHeaderCell() {
  return (
    <div
      className={cn(
        'flex items-center justify-start h-full pl-4',
        'bg-muted/50 hover:bg-muted',
        'data-[state=open]:bg-muted',
      )}
    >
      <Checkbox
        aria-label="Select all rows"
        checked={false}
      />
    </div>
  );
}

export function SelectCell({
  row,
  rowIndex,
  onClick,
}: {
  row: Row;
  rowIndex: number;
  onClick?: () => void;
}) {
  const isRowSelected = false;
  return (
    <div
      className={cn('flex items-center justify-start h-full pl-4 group')}
      onClick={onClick}
    >
      <div
        className={cn('group-hover:block hidden', isRowSelected && '!block')}
      >
        <Checkbox
          aria-label="Select row"
          checked={Boolean(isRowSelected)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div
        className={cn(
          'group-hover:hidden block select-none',
          isRowSelected && '!hidden',
        )}
      >
        {rowIndex}
      </div>
    </div>
  );
}
