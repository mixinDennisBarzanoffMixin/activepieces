import { ApFlagId, isNil, Permission } from '@activepieces/shared';
import { Plus } from 'lucide-solid';
import { JSX } from 'solid-js';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';

import {
  ClientField,
  ClientRecordData,
} from '../stores/store/ap-tables-client-state';
import { Row } from '../types/types';

import { ApFieldHeader } from './ap-field-header';
import { useTableState } from './ap-table-state-provider';
import { EditableCell } from './editable-cell';
import { NewFieldPopup } from './new-field-popup';
import { SelectCell, SelectHeaderCell } from './select-column';

export type TableColumn = {
  key: string;
  name: string;
  minWidth?: number;
  maxWidth?: number;
  width?: number;
  minHeight?: number;
  resizable?: boolean;
  sortable?: boolean;
  frozen?: boolean;
  renderHeaderCell?: () => JSX.Element;
  renderCell?: (props: TableCellProps) => JSX.Element;
  renderSummaryCell?: () => JSX.Element;
};

type TableCellProps = {
  row: Row;
  column: { key: string; idx: number };
  rowIdx: number;
};

export function useTableColumns(createEmptyRecord: () => void) {
  const [fields, setSelectedAgentRunId] = useTableState((state) => [
    state.fields,
    state.setSelectedAgentRunId,
  ]);

  const { data: maxFields } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FIELDS_PER_TABLE,
  );

  const lockedByOtherUser = useTableState((state) => state.lockedByOtherUser);
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const canEdit = userHasTableWritePermission && !lockedByOtherUser;
  const isAllowedToCreateField =
    canEdit && maxFields && fields.length < maxFields;

  const newFieldColumn: TableColumn = {
    key: 'new-field',
    minWidth: 67,
    maxWidth: 67,
    width: 67,
    name: '',
    renderHeaderCell: () => <AddFieldButton />,
    renderCell: () => <div class="empty-cell" />,
  };

  const columns: TableColumn[] = [
    {
      key: 'select-row',
      name: 'Select',
      width: 66,
      minWidth: 66,
      maxWidth: 66,
      resizable: false,
      sortable: false,
      frozen: true,
      renderHeaderCell: () => <SelectHeaderCell />,
      renderCell: (props) => (
        <SelectCell
          row={props.row}
          rowIndex={props.rowIdx + 1}
          onClick={() => {
            if (props.row.locked && props.row.agentRunId) {
              setSelectedAgentRunId(props.row.agentRunId);
            }
          }}
        />
      ),
      renderSummaryCell: () => (
        <AddRecordButton
          handleClick={createEmptyRecord}
          icon={<Plus class="size-4" />}
        />
      ),
    },
    ...fields.map(
      (field, index): TableColumn => ({
        key: field.uuid,
        minWidth: 207,
        width: 207,
        minHeight: 37,
        resizable: true,
        name: '',
        renderHeaderCell: () => <ApFieldHeader field={{ ...field, index }} />,
        renderCell: (props) => (
          <EditableCell
            key={props.row.id + '_' + field.uuid}
            field={field}
            value={getCellValue(props.row[field.uuid])}
            row={props.row}
            column={props.column}
            rowIdx={props.rowIdx}
            disabled={!canEdit}
            locked={props.row.locked}
            onClick={() => {
              if (props.row.locked && props.row.agentRunId) {
                setSelectedAgentRunId(props.row.agentRunId);
              }
            }}
          />
        ),
        renderSummaryCell: () => (
          <AddRecordButton handleClick={createEmptyRecord} />
        ),
      }),
    ),
  ];

  if (isAllowedToCreateField) {
    columns.push(newFieldColumn);
  }
  return columns;
}

export function mapRecordsToRows(
  records: ClientRecordData[],
  fields: ClientField[],
): Row[] {
  if (!records || records.length === 0) return [];
  return records.map((record: ClientRecordData) => {
    const row: Row = {
      id: record.uuid,
      agentRunId: record.agentRunId ?? null,
      locked: !isNil(record.agentRunId),
    };
    record.values.forEach((cell) => {
      const field = fields[cell.fieldIndex];
      if (field) {
        row[field.uuid] = cell.value;
      }
    });
    return row;
  });
}

function getCellValue(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

type AddRecordButtonProps = {
  handleClick: () => void;
  icon?: JSX.Element | string | number | null | undefined;
};

function AddRecordButton(props: AddRecordButtonProps) {
  return (
    <div
      class="w-full h-full border-t border-border  flex items-center justify-start cursor-pointer pl-4"
      onClick={() => {
        props.handleClick();
      }}
    >
      {props.icon}
    </div>
  );
}

function AddFieldButton() {
  return (
    <NewFieldPopup>
      <div class="w-full h-full flex items-center justify-center cursor-pointer new-field">
        <Plus class="h-4 w-4" />
      </div>
    </NewFieldPopup>
  );
}
