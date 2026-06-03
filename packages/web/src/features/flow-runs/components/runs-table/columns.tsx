import { FlowRun, FlowRunStatus, isNil, SeekPage } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import {
  Archive,
  ChevronDown,
  Hourglass,
  Workflow,
  Activity,
  Clock,
  Timer,
  AlertTriangle,
} from 'lucide-solid';
import { Match, Setter, Switch, Show } from 'solid-js';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/custom/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/custom/formatted-date';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { formatUtils } from '@/lib/format-utils';

type SelectedRow = {
  id: string;
  status: FlowRunStatus;
};

type RunsTableColumnsProps = {
  data: SeekPage<FlowRun> | undefined;
  selectedRows: SelectedRow[];
  setSelectedRows: Setter<SelectedRow[]>;
  selectedAll: boolean;
  setSelectedAll: Setter<boolean>;
  excludedRows: Set<string>;
  setExcludedRows: Setter<Set<string>>;
  onViewError: (run: FlowRun) => void;
  onViewRun: (run: FlowRun) => void;
};
export const runsTableColumns = ({
  setSelectedRows,
  selectedRows,
  selectedAll,
  setSelectedAll,
  excludedRows,
  setExcludedRows,
  data,
  onViewError,
  onViewRun,
}: RunsTableColumnsProps): ColumnDef<RowDataWithActions<FlowRun>>[] => [
  {
    id: 'select',
    accessorKey: 'select',
    size: 40,
    minSize: 40,
    maxSize: 40,
    header: (props) => (
      <div class="flex items-center h-full relative">
        <Checkbox
          checked={selectedAll || props.table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            const isChecked = !!value;
            props.table.toggleAllPageRowsSelected(isChecked);

            if (isChecked) {
              const currentPageRows = props.table
                .getRowModel()
                .rows.map((row) => ({
                  id: row.original.id,
                  status: row.original.status,
                }));

              setSelectedRows((prev) => {
                const uniqueRows = new Map<string, SelectedRow>([
                  ...prev.map((row) => [row.id, row] as [string, SelectedRow]),
                  ...currentPageRows.map(
                    (row) => [row.id, row] as [string, SelectedRow],
                  ),
                ]);

                return Array.from(uniqueRows.values());
              });
            } else {
              setSelectedAll(false);
              setSelectedRows([]);
              setExcludedRows(new Set());
            }
          }}
        />
        <Show when={selectedRows.length > 0}>
          <div class="absolute left-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="xs">
                  <ChevronDown class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="z-50">
                <DropdownMenuItem
                  class="cursor-pointer"
                  onClick={() => {
                    const currentPageRows = props.table
                      .getRowModel()
                      .rows.map((row) => ({
                        id: row.original.id,
                        status: row.original.status,
                      }));
                    setSelectedRows(currentPageRows);
                    setSelectedAll(false);
                    setExcludedRows(new Set());
                    props.table.toggleAllPageRowsSelected(true);
                  }}
                >
                  {t('Select shown')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="cursor-pointer"
                  onClick={() => {
                    if (data?.data) {
                      const allRows = data.data.map((row) => ({
                        id: row.id,
                        status: row.status,
                      }));
                      setSelectedRows(allRows);
                      setSelectedAll(true);
                      setExcludedRows(new Set());
                      props.table.toggleAllPageRowsSelected(true);
                    }
                  }}
                >
                  {t('Select all')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Show>
      </div>
    ),
    cell: (props) => {
      const run = () => props.row.original;
      const isSelected = () =>
        selectedAll
          ? !excludedRows.has(run().id)
          : selectedRows.some((selectedRow) => selectedRow.id === run().id);

      return (
        <div class="flex items-center h-full">
          <Checkbox
            checked={isSelected()}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              const current = run();
              if (selectedAll) {
                if (isChecked) {
                  setExcludedRows((prev) => {
                    const next = new Set(prev);
                    next.delete(current.id);
                    return next;
                  });
                } else {
                  setExcludedRows((prev) => new Set([...prev, current.id]));
                }
              } else {
                if (isChecked) {
                  setSelectedRows((prev) => [
                    ...prev,
                    {
                      id: current.id,
                      status: current.status,
                    },
                  ]);
                } else {
                  setSelectedRows((prev) =>
                    prev.filter((selectedRow) => selectedRow.id !== current.id),
                  );
                }
              }
              props.row.toggleSelected(isChecked);
            }}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'flowId',
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Flow')}
        icon={Workflow}
      />
    ),
    cell: (props) => {
      return (
        <div class="flex items-center gap-2 text-left">
          <Show when={!isNil(props.row.original.archivedAt)}>
            <Archive class="size-4 text-muted-foreground" />
          </Show>
          <TruncatedColumnTextValue
            value={props.row.original.flowVersion?.displayName ?? '—'}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Status')}
        icon={Activity}
      />
    ),
    cell: (props) => {
      const state = () => flowRunUtils.getStatusIcon(props.row.original.status);
      const Icon = () => state().Icon;
      return (
        <div class="text-left">
          <StatusIconWithText
            icon={Icon()}
            text={formatUtils.convertEnumToReadable(props.row.original.status)}
            variant={state().variant}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'created',
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Started At')}
        icon={Clock}
      />
    ),
    cell: (props) => {
      return (
        <div class="text-left">
          <FormattedDate
            date={new Date(props.row.original.created ?? new Date())}
            class="text-left"
            includeTime={true}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'duration',
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Duration')}
        icon={Timer}
      />
    ),
    cell: (props) => {
      const duration = () =>
        props.row.original.startTime && props.row.original.finishTime
          ? new Date(props.row.original.finishTime).getTime() -
            new Date(props.row.original.startTime).getTime()
          : undefined;
      const waitDuration = () =>
        props.row.original.startTime && props.row.original.created
          ? new Date(props.row.original.startTime).getTime() -
            new Date(props.row.original.created).getTime()
          : undefined;

      return (
        <Tooltip>
          <TooltipTrigger>
            <div class="text-left flex items-center gap-2">
              <Show when={props.row.original.finishTime}>
                <>
                  <Hourglass class="h-4 w-4 text-muted-foreground" />
                  {formatUtils.formatDuration(duration())}
                </>
              </Show>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t(
              `Time waited before first execution attempt: ${formatUtils.formatDuration(
                waitDuration(),
              )}`,
            )}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'failedStep',
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Failure')}
        icon={AlertTriangle}
      />
    ),
    cell: (props) => {
      return (
        <Switch fallback={<div class="text-left">-</div>}>
          <Match when={props.row.original.failedStep}>
            {(failedStep) => (
              <div class="text-left">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (failedStep().message) {
                          onViewError(props.row.original);
                          return;
                        }
                        onViewRun(props.row.original);
                      }}
                    >
                      {t('View error')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t('Failed on ({stepName})', {
                      stepName: failedStep().displayName,
                    })}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </Match>
        </Switch>
      );
    },
  },
];
