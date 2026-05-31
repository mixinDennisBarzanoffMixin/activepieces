'use client';

import { apId, isNil, SeekPage } from '@activepieces/shared';
import { useSearchParams } from '@solidjs/router';
import { createVirtualizer } from '@tanstack/solid-virtual';
import {
  ColumnDef as TanstackColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  createSolidTable,
} from '@tanstack/solid-table';
import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import { For, Show, createSignal, createEffect, createMemo } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { DataTableBulkActions } from './data-table-bulk-actions';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableFilter, DataTableFilterProps } from './data-table-filter';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableToolbar } from './data-table-toolbar';

export type DataWithId = {
  id?: string;
};
export type RowDataWithActions<TData extends DataWithId> = TData & {
  delete: () => void;
  update: (payload: Partial<TData>) => void;
};

export const CURSOR_QUERY_PARAM = 'cursor';
export const LIMIT_QUERY_PARAM = 'limit';

type DataTableAction<TData extends DataWithId> = (
  row: RowDataWithActions<TData>,
) => any;

type ColumnDef<TData, TValue> = TanstackColumnDef<TData, TValue> & {
  notClickable?: boolean;
};

interface DataTableProps<
  TData extends DataWithId,
  TValue,
  Keys extends string,
> {
  columns: ColumnDef<RowDataWithActions<TData>, TValue>[];
  page: SeekPage<TData> | undefined;
  onRowClick?: (
    row: RowDataWithActions<TData>,
    newWindow: boolean,
    e: MouseEvent,
  ) => void;
  isLoading: boolean;
  filters?: DataTableFilters<Keys>[];
  customFilters?: any[];
  onSelectedRowsChange?: (rows: RowDataWithActions<TData>[]) => void;
  actions?: DataTableAction<TData>[];
  hidePagination?: boolean;
  bulkActions?: BulkAction<TData>[];
  toolbarButtons?: any[];
  emptyStateTextTitle: string;
  emptyStateTextDescription: string;
  emptyStateIcon: any;
  selectColumn?: boolean;
  initialSorting?: SortingState;
  clientPagination?: boolean;
  getRowClassName?: (row: RowDataWithActions<TData>, index: number) => string;
  virtualizeRows?: boolean;
}

export type DataTableFilters<Keys extends string> = DataTableFilterProps & {
  accessorKey: Keys;
};

export type BulkAction<TData extends DataWithId> = {
  render: (
    selectedRows: RowDataWithActions<TData>[],
    resetSelection: () => void,
  ) => any;
};

export function DataTable<
  TData extends DataWithId,
  TValue,
  Keys extends string,
>({
  columns: columnsInitial,
  page,
  onRowClick,
  filters = [],
  actions = [],
  isLoading,
  onSelectedRowsChange,
  hidePagination,
  bulkActions = [],
  toolbarButtons,
  emptyStateTextTitle,
  emptyStateTextDescription,
  emptyStateIcon,
  customFilters,
  selectColumn = false,
  initialSorting = [],
  clientPagination = false,
  getRowClassName,
  virtualizeRows = false,
}: DataTableProps<TData, TValue, Keys>) {
  const selectColumnDef: ColumnDef<RowDataWithActions<TData>, TValue> = {
    id: 'select',
    accessorKey: 'select',
    notClickable: true,
    size: 40,
    minSize: 40,
    maxSize: 40,
    header: ({ table }) => (
      <div className="flex items-center h-full">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center h-full">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
  };

  const columnsWithSelect = selectColumn
    ? [selectColumnDef, ...columnsInitial]
    : columnsInitial;

  const columns =
    actions.length > 0
      ? columnsWithSelect.concat([
          {
            accessorKey: '__actions',
            size: 60,
            minSize: 60,
            maxSize: 60,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="" />
            ),
            cell: ({ row }) => {
              return (
                <div className="flex justify-end gap-4">
                  <For each={actions}>
                    {(action, index) => <>{action(row.original)}</>}
                  </For>
                </div>
              );
            },
          },
        ])
      : columnsWithSelect;

  const columnVisibility = columnsInitial.reduce((acc, column) => {
    if (column.enableHiding && 'accessorKey' in column) {
      acc[column.accessorKey as string] = false;
    }
    return acc;
  }, {} as Record<string, boolean>);

  const [searchParams, setSearchParams] = useSearchParams();
  const startingCursor = searchParams.cursor || undefined;
  const startingLimit = searchParams.limit || '10';
  const [currentCursor, setCurrentCursor] = createSignal<string | undefined>(
    startingCursor,
  );
  const [nextPageCursor, setNextPageCursor] = createSignal<string | undefined>(
    page?.next ?? undefined,
  );
  const [previousPageCursor, setPreviousPageCursor] = createSignal<
    string | undefined
  >(page?.previous ?? undefined);

  const enrichPageData = (data: TData[]) => {
    return data.map((row, index) => ({
      ...row,
      delete: () => {
        setDeletedRows((prevDeletedRows) => [...prevDeletedRows, row]);
      },
      update: (payload: Partial<TData>) => {
        setTableData((prevData) => {
          const newData = [...prevData];
          newData[index] = { ...newData[index], ...payload };
          return newData;
        });
      },
    }));
  };

  const [deletedRows, setDeletedRows] = createSignal<TData[]>([]);
  const [tableData, setTableData] = createSignal<RowDataWithActions<TData>[]>(
    enrichPageData(page?.data ?? []),
  );

  createEffect(() => {
    setNextPageCursor(page?.next ?? undefined);
    setPreviousPageCursor(page?.previous ?? undefined);
    setTableData(enrichPageData(page?.data ?? []));
  });

  const table = createSolidTable({
    data: tableData(),
    columns,
    manualPagination: virtualizeRows ? false : !clientPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...((clientPagination || virtualizeRows) && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
    getRowId: () => apId(),
    initialState: {
      pagination: {
        pageSize: virtualizeRows
          ? tableData().length || 1000
          : parseInt(startingLimit),
      },
      columnVisibility,
      sorting: initialSorting,
    },
  });

  createEffect(() => {
    filters?.forEach((filter) => {
      const column = table.getColumn(filter.accessorKey);
      const values = searchParams[filter.accessorKey];
      if (column && values) {
        column.setFilterValue(values);
      }
    });
  });

  const rowSelection = table.getState().rowSelection;
  const selectedRowOriginals = createMemo(() =>
    table.getSelectedRowModel().rows.map((row) => row.original),
  );
  createEffect(() => {
    onSelectedRowsChange?.(selectedRowOriginals());
  });

  createEffect(() => {
    if (hidePagination) {
      return;
    }
    setSearchParams(
      {
        ...searchParams,
        cursor: currentCursor() || undefined,
        limit: `${table.getState().pagination.pageSize}`,
      },
      { replace: true },
    );
  });

  createEffect(() => {
    setTableData(
      tableData().filter(
        (row) => !deletedRows().some((deletedRow) => deletedRow.id === row.id),
      ),
    );
  });

  const resetSelection = () => {
    table.toggleAllRowsSelected(false);
  };

  let scrollContainerRef: HTMLDivElement | undefined;
  const rows = table.getRowModel().rows;
  const virtualizer = createVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef,
    estimateSize: () => 53,
    overscan: 15,
    enabled: virtualizeRows,
  });

  return (
    <div
      className={cn(
        virtualizeRows ? 'flex flex-col flex-1 min-h-0' : undefined,
      )}
    >
      <Show
        when={
          (filters && filters.length > 0) ||
          (customFilters && customFilters.length > 0) ||
          (toolbarButtons && toolbarButtons.length > 0)
        }
      >
        <DataTableToolbar>
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Show when={filters && filters.length > 0}>
                <For each={filters}>
                  {(filter) => (
                    <DataTableFilter
                      column={table.getColumn(filter.accessorKey)}
                      {...filter}
                    />
                  )}
                </For>
              </Show>
              <Show when={customFilters && customFilters.length > 0}>
                <For each={customFilters}>{(filter) => <>{filter}</>}</For>
              </Show>
            </div>
            <Show when={toolbarButtons && toolbarButtons.length > 0}>
              <div className="flex items-center gap-2">
                <For each={toolbarButtons}>{(button) => <>{button}</>}</For>
              </div>
            </Show>
          </div>
        </DataTableToolbar>
      </Show>

      <div
        ref={(el) => (scrollContainerRef = el)}
        className={cn('mt-0', {
          'overflow-hidden': !virtualizeRows,
          'flex-1 min-h-0 overflow-auto': virtualizeRows,
        })}
      >
        <Table class="table-fixed">
          <TableHeader
            class={cn(virtualizeRows ? 'sticky top-0 z-10' : undefined)}
          >
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <TableRow class="hover:bg-transparent">
                  <For each={headerGroup.headers}>
                    {(header) => {
                      const size = header.column.columnDef.size;
                      return (
                        <TableHead
                          style={
                            size
                              ? { width: size, minWidth: size, maxWidth: size }
                              : undefined
                          }
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    }}
                  </For>
                </TableRow>
              )}
            </For>
          </TableHeader>
          <TableBody>
            <Show
              when={isLoading}
              fallback={
                <Show
                  when={rows.length > 0}
                  fallback={
                    <TableRow class="hover:bg-background">
                      <TableCell
                        colSpan={columns.length}
                        class="h-[350px] text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Show when={emptyStateIcon} fallback={<></>}>
                            {emptyStateIcon}
                          </Show>
                          <p className="text-lg font-semibold">
                            {emptyStateTextTitle}
                          </p>
                          <Show when={emptyStateTextDescription}>
                            <p className="text-sm text-muted-foreground ">
                              {emptyStateTextDescription}
                            </p>
                          </Show>
                        </div>
                      </TableCell>
                    </TableRow>
                  }
                >
                  <Show
                    when={virtualizeRows}
                    fallback={
                      <For each={rows}>
                        {(row, rowIndex) => (
                          <TableRow
                            class={cn(
                              'cursor-pointer',
                              {
                                'hover:bg-background cursor-default':
                                  isNil(onRowClick),
                              },
                              getRowClassName?.(row.original, rowIndex()),
                            )}
                            onClick={(e) => {
                              const clickedCellIndex = (
                                e.target as HTMLElement
                              ).closest('td')?.cellIndex;
                              if (
                                clickedCellIndex !== undefined &&
                                columns[clickedCellIndex]?.notClickable
                              ) {
                                return;
                              }
                              onRowClick?.(row.original, e.ctrlKey, e);
                            }}
                            onAuxClick={(e) => {
                              const clickedCellIndex = (
                                e.target as HTMLElement
                              ).closest('td')?.cellIndex;
                              if (
                                clickedCellIndex !== undefined &&
                                columns[clickedCellIndex]?.notClickable
                              ) {
                                return;
                              }
                              onRowClick?.(row.original, true, e);
                            }}
                            data-state={row.getIsSelected() && 'selected'}
                          >
                            <For each={row.getVisibleCells()}>
                              {(cell) => {
                                const size = cell.column.columnDef.size;
                                return (
                                  <TableCell
                                    style={
                                      size
                                        ? {
                                            width: size,
                                            minWidth: size,
                                            maxWidth: size,
                                          }
                                        : undefined
                                    }
                                  >
                                    <div
                                      className={cn(
                                        'flex w-full items-center',
                                        {
                                          'justify-end':
                                            cell.column.id === 'actions',
                                          'justify-start':
                                            cell.column.id !== 'actions',
                                        },
                                      )}
                                    >
                                      <div
                                        className="w-full"
                                        onClick={(e) => {
                                          if (cell.column.id === 'select') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return;
                                          }
                                        }}
                                      >
                                        {flexRender(
                                          cell.column.columnDef.cell,
                                          cell.getContext(),
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                );
                              }}
                            </For>
                          </TableRow>
                        )}
                      </For>
                    }
                  >
                    <>
                      <Show when={virtualizer.getVirtualItems().length > 0}>
                        <tr>
                          <td
                            colSpan={columns.length}
                            style={{
                              height: virtualizer.getVirtualItems()[0].start,
                            }}
                          />
                        </tr>
                      </Show>
                      <For each={virtualizer.getVirtualItems()}>
                        {(virtualRow) => {
                          const row = rows[virtualRow.index];
                          const rowIndex = virtualRow.index;
                          return (
                            <TableRow
                              data-index={virtualRow.index}
                              class={cn(
                                'cursor-pointer',
                                {
                                  'hover:bg-background cursor-default':
                                    isNil(onRowClick),
                                },
                                getRowClassName?.(row.original, rowIndex),
                              )}
                              onClick={(e) => {
                                const clickedCellIndex = (
                                  e.target as HTMLElement
                                ).closest('td')?.cellIndex;
                                if (
                                  clickedCellIndex !== undefined &&
                                  columns[clickedCellIndex]?.notClickable
                                ) {
                                  return;
                                }
                                onRowClick?.(row.original, e.ctrlKey, e);
                              }}
                              onAuxClick={(e) => {
                                const clickedCellIndex = (
                                  e.target as HTMLElement
                                ).closest('td')?.cellIndex;
                                if (
                                  clickedCellIndex !== undefined &&
                                  columns[clickedCellIndex]?.notClickable
                                ) {
                                  return;
                                }
                                onRowClick?.(row.original, true, e);
                              }}
                              data-state={row.getIsSelected() && 'selected'}
                            >
                              <For each={row.getVisibleCells()}>
                                {(cell) => {
                                  const size = cell.column.columnDef.size;
                                  return (
                                    <TableCell
                                      style={
                                        size
                                          ? {
                                              width: size,
                                              minWidth: size,
                                              maxWidth: size,
                                            }
                                          : undefined
                                      }
                                    >
                                      <div
                                        className={cn(
                                          'flex w-full items-center',
                                          {
                                            'justify-end':
                                              cell.column.id === 'actions',
                                            'justify-start':
                                              cell.column.id !== 'actions',
                                          },
                                        )}
                                      >
                                        <div
                                          className="w-full"
                                          onClick={(e) => {
                                            if (cell.column.id === 'select') {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              return;
                                            }
                                          }}
                                        >
                                          {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                  );
                                }}
                              </For>
                            </TableRow>
                          );
                        }}
                      </For>
                      <Show when={virtualizer.getVirtualItems().length > 0}>
                        <tr>
                          <td
                            colSpan={columns.length}
                            style={{
                              height:
                                virtualizer.getTotalSize() -
                                (virtualizer.getVirtualItems().at(-1)?.end ??
                                  0),
                            }}
                          />
                        </tr>
                      </Show>
                    </>
                  </Show>
                </Show>
              }
            >
              <TableRow class="hover:bg-background">
                <TableCell colSpan={columns.length} class="h-24 text-center">
                  <DataTableSkeleton />
                </TableCell>
              </TableRow>
            </Show>
          </TableBody>
        </Table>
      </div>
      <Show when={!hidePagination && !virtualizeRows}>
        <div className="flex items-center justify-end gap-4 px-2 py-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t('Rows per page')}</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
                if (!clientPagination) {
                  setCurrentCursor(undefined);
                }
              }}
            >
              <SelectTrigger class="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                <For each={[10, 30, 50]}>
                  {(pageSize) => (
                    <SelectItem value={`${pageSize}`}>{pageSize}</SelectItem>
                  )}
                </For>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="gap-1"
            onClick={() => {
              if (clientPagination) {
                table.previousPage();
              } else {
                setCurrentCursor(previousPageCursor());
              }
            }}
            disabled={
              clientPagination
                ? !table.getCanPreviousPage()
                : !previousPageCursor()
            }
          >
            <ChevronLeft class="h-4 w-4" />
            {t('Previous')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="gap-1"
            onClick={() => {
              if (clientPagination) {
                table.nextPage();
              } else {
                setCurrentCursor(nextPageCursor());
              }
            }}
            disabled={
              clientPagination ? !table.getCanNextPage() : !nextPageCursor()
            }
          >
            {t('Next')}
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </Show>
      <Show when={bulkActions.length > 0}>
        <DataTableBulkActions
          selectedRows={selectedRowOriginals()}
          actions={bulkActions}
          resetSelection={resetSelection}
        />
      </Show>
    </div>
  );
}
