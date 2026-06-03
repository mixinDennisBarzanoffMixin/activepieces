import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { Row } from '../types/types';

export function SelectHeaderCell() {
  return (
    <div
      class={cn(
        'flex items-center justify-start h-full pl-4',
        'bg-muted/50 hover:bg-muted',
        'data-[state=open]:bg-muted',
      )}
    >
      <Checkbox aria-label="Select all rows" checked={false} />
    </div>
  );
}

export function SelectCell(props: {
  row: Row;
  rowIndex: number;
  onClick?: () => void;
}) {
  const isRowSelected = false;
  return (
    <div
      class={cn('flex items-center justify-start h-full pl-4 group')}
      onClick={() => {
        props.onClick?.();
      }}
    >
      <div class={cn('group-hover:block hidden', isRowSelected && '!block')}>
        <Checkbox
          aria-label="Select row"
          checked={Boolean(isRowSelected)}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
          }}
        />
      </div>
      <div
        class={cn(
          'group-hover:hidden block select-none',
          isRowSelected && '!hidden',
        )}
      >
        {props.rowIndex}
      </div>
    </div>
  );
}
