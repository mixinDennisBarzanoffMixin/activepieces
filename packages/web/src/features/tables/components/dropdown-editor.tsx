import { FieldType, StaticDropdownEmptyOption } from '@activepieces/shared';
import { Show } from 'solid-js';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { cn } from '@/lib/utils';

import { useTableState } from './ap-table-state-provider';
import { useCellContext } from './cell-context';

const DropdownEditor = () => {
  const cell = useCellContext();
  const field = useTableState((state) => state.fields[cell.columnIdx]);
  const containerRef = null;
  const handleChange = (newValue: string | null) => {
    cell.handleCellChange(newValue ?? '');
  };
  return (
    <Show when={field.type === FieldType.STATIC_DROPDOWN ? field : null}>
      {(dropdown) => (
        <div
          class={cn('h-full w-full', {
            'border-primary  border-2': cell.isEditing,
          })}
          ref={containerRef}
        >
          <SearchableSelect
            triggerClassName={cn(
              'rounded-none px-2 border-none bg-transparent',
            )}
            onClose={() => {
              cell.setIsEditing(false);
            }}
            options={[
              StaticDropdownEmptyOption,
              ...dropdown().data.options.map((option) => ({
                value: option.value,
                label: option.value,
              })),
            ]}
            onInput={handleChange}
            value={cell.value}
            disabled={cell.disabled}
            placeholder={''}
            showDeselect={false}
            openState={{
              open: cell.isEditing,
              setOpen: cell.setIsEditing,
            }}
          />
        </div>
      )}
    </Show>
  );
};
export { DropdownEditor };
