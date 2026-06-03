import { FieldType } from '@activepieces/shared';
import {
  ErrorBoundary,
  Match,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
} from 'solid-js';

import { cn } from '@/lib/utils';

import { ClientField } from '../stores/store/ap-tables-client-state';
import { Row } from '../types/types';

import { useTableState } from './ap-table-state-provider';
import { CellProvider } from './cell-context';
import { DateEditor } from './date-editor';
import { DropdownEditor } from './dropdown-editor';
import { NumberEditor } from './number-editor';
import { TextEditor } from './text-editor';

type EditableCellProps = {
  field: ClientField;
  value?: string;
  row: Row;
  onClick?: () => void;
  column: { key: string; idx: number };
  rowIdx: number;
  disabled?: boolean;
  locked?: boolean;
};

const EditorSelector = (props: { fieldType: FieldType }) => {
  return (
    <Switch fallback={<TextEditor />}>
      <Match when={props.fieldType === FieldType.DATE}>
        <DateEditor />
      </Match>
      <Match when={props.fieldType === FieldType.NUMBER}>
        <NumberEditor />
      </Match>
      <Match when={props.fieldType === FieldType.STATIC_DROPDOWN}>
        <DropdownEditor />
      </Match>
    </Switch>
  );
};

const useSetInitialFocus = (selected: () => boolean) => {
  const ref: { current?: HTMLDivElement } = {};
  createEffect(() => {
    requestAnimationFrame(() => {
      if (selected()) {
        ref.current?.focus();
      }
    });
  });
  return ref;
};

export function EditableCell(_props: EditableCellProps) {
  const props = mergeProps({ locked: false, disabled: false }, _props);
  const [selectedCell, setSelectedCell, records, fields] = useTableState(
    (state) => [
      state.selectedCell,
      state.setSelectedCell,
      state.records,
      state.fields,
    ],
  );
  const [isEditing, setIsEditing] = createSignal(false);
  const value = createMemo(() => props.value || '');
  const isSelected = () =>
    selectedCell?.rowIdx === props.rowIdx &&
    selectedCell.columnIdx === props.column.idx;
  const containerRef = useSetInitialFocus(isSelected);
  const handleKeyDown = (e: KeyboardEvent) => {
    const isTypingKey = e.key.length === 1 || e.key === 'Enter';
    if (isTypingKey && !props.disabled && !isEditing) {
      setIsEditing(true);
      setSelectedCell({ rowIdx: props.rowIdx, columnIdx: props.column.idx });
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
    // react data grid cells are all focusable and they have no api to prevent focus
    // so we need to prevent the default behavior of the arrow keys
    switch (e.key) {
      case 'ArrowUp': {
        if (props.rowIdx === 0) {
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      }
      case 'ArrowDown': {
        if (props.rowIdx === records.length - 1) {
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      }
      case 'ArrowLeft':
        if (props.column.idx === 1) {
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      case 'ArrowRight': {
        if (props.column.idx === fields.length) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
  };
  return (
    <div
      ref={(el) => {
        containerRef.current = el;
      }}
      id={`editable-cell-${props.rowIdx}-${props.column.idx}`}
      class={
        isEditing
          ? 'h-full w-full'
          : cn(
              'h-full flex items-center justify-between gap-2  focus:outline-hidden  ',
              'group cursor-pointer border',
              isSelected() && !props.locked
                ? 'border-primary'
                : 'border-transparent',
              props.locked && 'locked-row',
              props.field.type !== FieldType.STATIC_DROPDOWN && 'pl-2 py-2',
            )
      }
      tabIndex={0}
      onClick={() => {
        props.onClick?.();
        setSelectedCell({ rowIdx: props.rowIdx, columnIdx: props.column.idx });
      }}
      onFocus={() => {
        setSelectedCell({ rowIdx: props.rowIdx, columnIdx: props.column.idx });
      }}
      onDblClick={() => {
        if (!props.disabled) {
          setIsEditing(true);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <ErrorBoundary fallback={<div>Error</div>}>
        <CellProvider
          rowIdx={props.rowIdx}
          columnIdx={props.column.idx - 1}
          fieldType={props.field.type}
          value={value}
          handleCellChange={() => {}}
          containerRef={containerRef.current}
          isEditing={isEditing()}
          setIsEditing={setIsEditing}
          disabled={props.disabled}
        >
          <EditorSelector fieldType={props.field.type} />
        </CellProvider>
      </ErrorBoundary>
    </div>
  );
}
