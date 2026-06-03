'use client';

import { apId, isNil, SeekPage } from '@activepieces/shared';
import { useSearchParams } from '@solidjs/router';
import {
  ColumnDef as TanstackColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  createSolidTable,
} from '@tanstack/solid-table';
import { createVirtualizer } from '@tanstack/solid-virtual';
import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import {
  For,
  JSX,
  Show,
  createSignal,
  createEffect,
  createMemo,
  mergeProps,
} from 'solid-js';

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
) => JSX.Element;

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
  customFilters?: JSX.Element[];
  onSelectedRowsChange?: (rows: RowDataWithActions<TData>[]) => void;
  actions?: DataTableAction<TData>[];
  hidePagination?: boolean;
  bulkActions?: BulkAction<TData>[];
  toolbarButtons?: JSX.Element[];
  emptyStateTextTitle: string;
  emptyStateTextDescription: string;
  emptyStateIcon: JSX.Element;
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
  ) => JSX.Element;
};

export function DataTable<
  TData extends DataWithId,
  TValue,
  Keys extends string,
>(_props: DataTableProps<TData, TValue, Keys>) {
  const props = mergeProps(
    {
      filters: [],
      actions: [],
      bulkActions: [],
      selectColumn: false,
      initialSorting: [],
      clientPagination: false,
      virtualizeRows: false,
    },
    _props,
  );
  const selectColumnDef: ColumnDef<RowDataWithActions<TData>, TValue> = {
    id: 'select',
    accessorKey: 'select',
    notClickable: true,
    size: 40,
    minSize: 40,
    maxSize: 40,
    header: (props) => (
      <div class="flex items-center h-full">
        <Checkbox
          checked={props.table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) =>
            props.table.toggleAllPageRowsSelected(!!value)
          }
        />
      </div>
    ),
    cell: (props) => (
      <div class="flex items-center h-full">
        <Checkbox
          checked={props.row.getIsSelected()}
          onCheckedChange={(value) => props.row.toggleSelected(!!value)}
        />
      </div>
    ),
  };

  const columns = createMemo(() => {
    const base = props.selectColumn
      ? [selectColumnDef, ...props.columns]
      : props.columns;
    return props.actions.length > 0
      ? base.concat([
          {
            accessorKey: '__actions',
            size: 60,
            minSize: 60,
            maxSize: 60,
            header: (ctx) => (
              <DataTableColumnHeader column={ctx.column} title="" />
            ),
            cell: (ctx) => {
              return (
                <div class="flex justify-end gap-4">
                  <For each={props.actions}>
                    {(action) => <>{action(ctx.row.original)}</>}
                  </For>
                </div>
              );
            },
          },
        ])
      : base;
  });

  const columnVisibility = createMemo(() =>
    Object.fromEntries(
      props.columns
        .filter(
          (
            column,
          ): column is ColumnDef<RowDataWithActions<TData>, TValue> & {
            accessorKey: string;
          } =>
            column.enableHiding === true &&
            'accessorKey' in column &&
            typeof column.accessorKey === 'string',
        )
        .map((column) => [column.accessorKey, false]),
    ),
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const startingCursor = searchParams.cursor || undefined;
  const startingLimit = searchParams.limit || '10';
  const [currentCursor, setCurrentCursor] = createSignal<string | undefined>(
    startingCursor,
  );
  const [nextPageCursor, setNextPageCursor] = createSignal<string | undefined>(
    undefined,
  );
  const [previousPageCursor, setPreviousPageCursor] = createSignal<
    string | undefined
  >(undefined);

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
    [],
  );

  createEffect(() => {
    setNextPageCursor(props.page?.next ?? undefined);
    setPreviousPageCursor(props.page?.previous ?? undefined);
    setTableData(enrichPageData(props.page?.data ?? []));
  });

  const table = createSolidTable({
    get data() {
      return tableData();
    },
    get columns() {
      return columns();
    },
    get manualPagination() {
      return props.virtualizeRows ? false : !props.clientPagination;
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: () => apId(),
    initialState: {
      pagination: {
        pageSize: parseInt(startingLimit),
      },
      columnVisibility: {},
      sorting: props.initialSorting,
    },
  });

  createEffect(() => {
    table.setColumnVisibility(columnVisibility());
  });

  createEffect(() => {
    props.filters.forEach((filter) => {
      const column = table.getColumn(filter.accessorKey);
      const values = searchParams[filter.accessorKey];
      if (column && values) {
        column.setFilterValue(values);
      }
    });
  });

  const selectedRowOriginals = createMemo(() =>
    table.getSelectedRowModel().rows.map((row) => row.original),
  );
  createEffect(() => {
    props.onSelectedRowsChange?.(selectedRowOriginals());
  });

  createEffect(() => {
    if (props.hidePagination) {
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

  const index = (e: MouseEvent) =>
    e.target instanceof HTMLElement
      ? e.target.closest('td')?.cellIndex
      : undefined;

  let scrollContainerRef: HTMLDivElement | undefined;
  const rows = createMemo(() => table.getRowModel().rows);
  const virtualizer = createVirtualizer({
    get count() {
      return rows().length;
    },
    getScrollElement: () => scrollContainerRef,
    estimateSize: () => 53,
    overscan: 15,
    get enabled() {
      return props.virtualizeRows;
    },
  });

  return (
    <div
      class={cn(
        props.virtualizeRows ? 'flex flex-col flex-1 min-h-0' : undefined,
      )}
    >
      <Show
        when={
          props.filters.length > 0 ||
          (props.customFilters && props.customFilters.length > 0) ||
          (props.toolbarButtons && props.toolbarButtons.length > 0)
        }
      >
        <DataTableToolbar>
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <Show when={props.filters.length > 0}>
                <For each={props.filters}>
                  {(filter) => (
                    <DataTableFilter
                      column={table.getColumn(filter.accessorKey)}
                      {...filter}
                    />
                  )}
                </For>
              </Show>
              <Show
                when={props.customFilters && props.customFilters.length > 0}
              >
                <For each={props.customFilters}>
                  {(filter) => <>{filter}</>}
                </For>
              </Show>
            </div>
            <Show
              when={props.toolbarButtons && props.toolbarButtons.length > 0}
            >
              <div class="flex items-center gap-2">
                <For each={props.toolbarButtons}>
                  {(button) => <>{button}</>}
                </For>
              </div>
            </Show>
          </div>
        </DataTableToolbar>
      </Show>

      <div
        ref={(el) => {
          scrollContainerRef = el;
        }}
        class={cn('mt-0', {
          'overflow-hidden': !props.virtualizeRows,
          'flex-1 min-h-0 overflow-auto': props.virtualizeRows,
        })}
      >
        <Table class="table-fixed">
          <TableHeader
            class={cn(props.virtualizeRows ? 'sticky top-0 z-10' : undefined)}
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
              when={props.isLoading}
              fallback={
                <Show
                  when={rows().length > 0}
                  fallback={
                    <TableRow class="hover:bg-background">
                      <TableCell
                        colSpan={columns().length}
                        class="h-[350px] text-center"
                      >
                        <div class="flex flex-col items-center justify-center gap-2">
                          <Show when={props.emptyStateIcon} fallback={<></>}>
                            {(icon) => icon()}
                          </Show>
                          <p class="text-lg font-semibold">
                            {props.emptyStateTextTitle}
                          </p>
                          <Show when={props.emptyStateTextDescription}>
                            <p class="text-sm text-muted-foreground ">
                              {props.emptyStateTextDescription}
                            </p>
                          </Show>
                        </div>
                      </TableCell>
                    </TableRow>
                  }
                >
                  <Show
                    when={props.virtualizeRows}
                    fallback={
                      <For each={rows()}>
                        {(row, rowIndex) => (
                          <TableRow
                            class={cn(
                              'cursor-pointer',
                              {
                                'hover:bg-background cursor-default': isNil(
                                  props.onRowClick,
                                ),
                              },
                              props.getRowClassName?.(row.original, rowIndex()),
                            )}
                            onClick={(e) => {
                              const cell = index(e);
                              if (
                                cell !== undefined &&
                                columns()[cell]?.notClickable
                              ) {
                                return;
                              }
                              props.onRowClick?.(row.original, e.ctrlKey, e);
                            }}
                            onAuxClick={(e) => {
                              const cell = index(e);
                              if (
                                cell !== undefined &&
                                columns()[cell]?.notClickable
                              ) {
                                return;
                              }
                              props.onRowClick?.(row.original, true, e);
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
                                      class={cn('flex w-full items-center', {
                                        'justify-end':
                                          cell.column.id === 'actions',
                                        'justify-start':
                                          cell.column.id !== 'actions',
                                      })}
                                    >
                                      <div
                                        class="w-full"
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
                            colSpan={columns().length}
                            style={{
                              height: virtualizer.getVirtualItems()[0].start,
                            }}
                          />
                        </tr>
                      </Show>
                      <For each={virtualizer.getVirtualItems()}>
                        {(virtualRow) => {
                          const row = rows()[virtualRow.index];
                          const rowIndex = virtualRow.index;
                          return (
                            <TableRow
                              data-index={virtualRow.index}
                              class={cn(
                                'cursor-pointer',
                                {
                                  'hover:bg-background cursor-default': isNil(
                                    props.onRowClick,
                                  ),
                                },
                                props.getRowClassName?.(row.original, rowIndex),
                              )}
                              onClick={(e) => {
                                const cell = index(e);
                                if (
                                  cell !== undefined &&
                                  columns()[cell]?.notClickable
                                ) {
                                  return;
                                }
                                props.onRowClick?.(row.original, e.ctrlKey, e);
                              }}
                              onAuxClick={(e) => {
                                const cell = index(e);
                                if (
                                  cell !== undefined &&
                                  columns()[cell]?.notClickable
                                ) {
                                  return;
                                }
                                props.onRowClick?.(row.original, true, e);
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
                                        class={cn('flex w-full items-center', {
                                          'justify-end':
                                            cell.column.id === 'actions',
                                          'justify-start':
                                            cell.column.id !== 'actions',
                                        })}
                                      >
                                        <div
                                          class="w-full"
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
                            colSpan={columns().length}
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
                <TableCell colSpan={columns().length} class="h-24 text-center">
                  <DataTableSkeleton />
                </TableCell>
              </TableRow>
            </Show>
          </TableBody>
        </Table>
      </div>
      <Show when={!props.hidePagination && !props.virtualizeRows}>
        <div class="flex items-center justify-end gap-4 px-2 py-4 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">{t('Rows per page')}</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
                if (!props.clientPagination) {
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
              if (props.clientPagination) {
                table.previousPage();
              } else {
                setCurrentCursor(previousPageCursor());
              }
            }}
            disabled={
              props.clientPagination
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
              if (props.clientPagination) {
                table.nextPage();
              } else {
                setCurrentCursor(nextPageCursor());
              }
            }}
            disabled={
              props.clientPagination
                ? !table.getCanNextPage()
                : !nextPageCursor()
            }
          >
            {t('Next')}
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </Show>
      <Show when={props.bulkActions.length > 0}>
        <DataTableBulkActions
          selectedRows={selectedRowOriginals()}
          actions={props.bulkActions}
          resetSelection={resetSelection}
        />
      </Show>
    </div>
  );
}
