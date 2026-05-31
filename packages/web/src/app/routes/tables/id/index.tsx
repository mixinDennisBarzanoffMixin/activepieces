import { createEffect, Show } from 'solid-js';
import { ApFlagId, Permission } from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { useNavigate } from '@solidjs/router';

import { useTheme } from '@/components/providers/theme-provider';
import {
  ApTableFooter,
  ApTableHeader,
  useTableState,
  useTableColumns,
  mapRecordsToRows,
  Row,
  ROW_HEIGHT_MAP,
  RowHeight,
} from '@/features/tables';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useResourceLock } from '@/hooks/use-resource-lock';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

const ApTableEditorPage = () => {
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId();
  const [
    selectedRecords,
    setSelectedRecords,
    selectedCell,
    setSelectedCell,
    createRecord,
    fields,
    records,
    table,
    setLockedByOtherUser,
  ] = useTableState((state) => [
    state.selectedRecords,
    state.setSelectedRecords,
    state.selectedCell,
    state.setSelectedCell,
    state.createRecord,
    state.fields,
    state.records,
    state.table,
    state.setLockedByOtherUser,
  ]);

  const { lockedBy, takeOver } = useResourceLock({
    resourceId: table.id,
  });

  createEffect(() => {
    setLockedByOtherUser(!!lockedBy);
  });

  let gridRef: HTMLDivElement | undefined;
  const { theme } = useTheme();
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const canEdit = userHasTableWritePermission && !lockedBy;
  const isAllowedToCreateRecord =
    canEdit && maxRecords && records.length < maxRecords;

  const createEmptyRecord = () => {
    createRecord({
      uuid: nanoid(),
      agentRunId: null,
      values: [],
    });
    requestAnimationFrame(() => {
      gridRef?.scrollTo({ top: gridRef.scrollHeight });
      setSelectedCell({
        rowIdx: records.length,
        columnIdx: 1,
      });
    });
  };

  createEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectedCell &&
        !(event.target as HTMLElement).closest(
          `#editable-cell-${selectedCell.rowIdx}-${selectedCell.columnIdx}`,
        )
      ) {
        setSelectedCell(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  const columns = useTableColumns(createEmptyRecord);
  const rows = mapRecordsToRows(records, fields);

  const handleBack = () => {
    navigate(`/projects/${projectId}/automations`);
  };

  return (
    <div className="w-full flex flex-col justify-start items-start h-full">
      <div className="flex items-center justify-between w-full pr-4 border-b">
        <ApTableHeader
          onBack={handleBack}
          lockedBy={lockedBy}
          takeOver={takeOver}
        />
      </div>

      <div className="flex w-full flex-col flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <div
              ref={(el) => (gridRef = el)}
              class={cn(
                'scroll-smooth w-full h-full overflow-auto bg-muted/30 border-0',
                theme === 'dark' ? 'dark' : 'light',
              )}
            >
              <div class="min-w-max">
                <div class="sticky top-0 z-10 flex bg-background border-b">
                  {columns.map((column, index) => (
                    <div class="border-r" style={{ width: `${column.width ?? 207}px` }}>
                      {column.renderHeaderCell?.() ?? column.name}
                    </div>
                  ))}
                </div>
                {rows.map((row, rowIdx) => (
                  <div class="flex border-b" style={{ height: `${ROW_HEIGHT_MAP[RowHeight.DEFAULT]}px` }}>
                    {columns.map((column, columnIdx) => (
                      <div class="border-r" style={{ width: `${column.width ?? 207}px` }}>
                        {column.renderCell?.({ row, rowIdx, column: { key: column.key, idx: columnIdx } })}
                      </div>
                    ))}
                  </div>
                ))}
                <Show when={isAllowedToCreateRecord}>
                  <div class="flex border-b" style={{ height: `${ROW_HEIGHT_MAP[RowHeight.DEFAULT]}px` }}>
                    {columns.map((column) => (
                      <div class="border-r" style={{ width: `${column.width ?? 207}px` }}>
                        {column.renderSummaryCell?.()}
                      </div>
                    ))}
                  </div>
                </Show>
              </div>
            </div>
          </div>
          <ApTableFooter
            fieldsCount={fields.length}
            recordsCount={records.length}
          />
        </div>
      </div>
    </div>
  );
};

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
