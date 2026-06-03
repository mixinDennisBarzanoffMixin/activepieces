import { TriggerStatusReport } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Puzzle,
  Hash,
  BarChart3,
  Clock,
  Calendar,
} from 'lucide-solid';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { triggerRunHooks } from '@/features/flows';
import { PieceDisplayName, PieceIconWithPieceName } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { StatusProgressBar, type DayStatus } from './status-progress-bar';

type TriggerHealthRow = {
  id: string;
  status: {
    type: string;
  };
  last24Hours: number;
  last7Days: number;
  last14Days: number;
  lastResults: DayStatus[];
  runs: number;
};

const STATUS = {
  SUCCESS: 'success',
  FAULT: 'fault',
  WARNING: 'warning',
};

const STATUS_TOOLTIPS: Record<string, string> = {
  [STATUS.SUCCESS]: 'All trigger runs were successful in the selected period.',
  [STATUS.WARNING]:
    'Some trigger runs failed. Please review for potential issues.',
  [STATUS.FAULT]: 'All trigger runs failed. Immediate attention required.',
};

const percentageForLastXDays = (
  days: number,
  pieceData: TriggerStatusReport['pieces'][string],
) => {
  const lastXDays = generateLastXDays(days);
  const successRuns = lastXDays.reduce(
    (acc, day) => acc + (pieceData.dailyStats[day].success ?? 0),
    0,
  );
  const failureRuns = lastXDays.reduce(
    (acc, day) => acc + (pieceData.dailyStats[day].failure ?? 0),
    0,
  );
  const percentage =
    successRuns > 0 ? (successRuns / (successRuns + failureRuns)) * 100 : 100;
  return Number(percentage.toFixed(1));
};

const generateLastXDays = (days: number): string[] => {
  return Array.from({ length: days }, (_, i) =>
    dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
  );
};

export default function TriggerHealthPage() {
  const { data: report, isLoading } = triggerRunHooks.useStatusReport();

  const triggerHealthData: TriggerHealthRow[] = isLoading
    ? []
    : Object.entries(report?.pieces ?? {}).map(([pieceName, pieceData]) => {
        const last7Days = percentageForLastXDays(7, pieceData);
        const last14Days = percentageForLastXDays(14, pieceData);
        const last24Hours = percentageForLastXDays(1, pieceData);
        return {
          id: pieceName,
          status: {
            type:
              last14Days === 100
                ? STATUS.SUCCESS
                : last14Days > 0
                ? STATUS.WARNING
                : STATUS.FAULT,
          },
          last24Hours,
          last7Days,
          last14Days,
          lastResults: generateLastXDays(14).map((day) => {
            const success = pieceData.dailyStats[day].success ?? 0;
            const failure = pieceData.dailyStats[day].failure ?? 0;
            const totalRuns = success + failure;
            return {
              date: day,
              success,
              failure,
              status:
                failure > 0 ? (success > 0 ? 'warning' : 'fault') : 'success',
              totalRuns: totalRuns,
            };
          }),
          runs: pieceData.totalRuns,
        };
      });

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case STATUS.SUCCESS:
        return <CheckCircle size={16} class="text-success-700" />;
      case STATUS.WARNING:
        return <AlertCircle size={16} class="text-amber-700" />;
      case STATUS.FAULT:
        return <XCircle size={16} class="text-destructive" />;
      default:
        return <AlertCircle size={16} class="text-gray-500" />;
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case STATUS.SUCCESS:
        return 'text-success-700';
      case STATUS.WARNING:
        return 'text-amber-700';
      case STATUS.FAULT:
        return 'text-destructive';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusTooltip = (statusType: string) => {
    return STATUS_TOOLTIPS[statusType] || 'Unknown status';
  };

  const columns: ColumnDef<RowDataWithActions<TriggerHealthRow>>[] = [
    {
      accessorKey: 'pieceDisplayName',
      size: 220,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title="Piece"
          icon={Puzzle}
        />
      ),
      cell: (props) => {
        return (
          <div class="flex items-center gap-2">
            <PieceIconWithPieceName
              pieceName={props.row.original.id}
              showTooltip={false}
              size="md"
            />
            <div class="flex flex-col">
              <div class="font-medium flex items-center gap-2">
                <PieceDisplayName pieceName={props.row.original.id} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      class={cn(
                        'flex items-center ml-2',
                        getStatusColor(props.row.original.status.type),
                      )}
                      tabIndex={0}
                      aria-label={getStatusTooltip(
                        props.row.original.status.type,
                      )}
                      style={{ cursor: 'pointer' }}
                    >
                      {getStatusIcon(props.row.original.status.type)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {getStatusTooltip(props.row.original.status.type)}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'runs',
      size: 160,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title="Total Runs (14D)"
          icon={Hash}
        />
      ),
      cell: (props) => (
        <div class="font-medium">
          {props.row.original.runs.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'lastResults',
      size: 190,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title="Last Results"
          icon={BarChart3}
        />
      ),
      cell: (props) => (
        <StatusProgressBar days={props.row.original.lastResults} />
      ),
    },
    {
      accessorKey: 'last24Hours',
      size: 70,
      header: (props) => (
        <DataTableColumnHeader column={props.column} title="24H" icon={Clock} />
      ),
      cell: (props) => (
        <div class={cn('font-medium')}>{props.row.original.last24Hours}%</div>
      ),
    },
    {
      accessorKey: 'last7Days',
      size: 65,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title="7D"
          icon={Calendar}
        />
      ),
      cell: (props) => (
        <div class={cn('font-medium')}>{props.row.original.last7Days}%</div>
      ),
    },
    {
      accessorKey: 'last14Days',
      size: 65,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title="14D"
          icon={Calendar}
        />
      ),
      cell: (props) => (
        <div class={cn('font-medium')}>{props.row.original.last14Days}%</div>
      ),
    },
  ];

  return (
    <div class="flex flex-col w-full gap-4">
      <DashboardPageHeader
        title={String(t('Trigger Health Status'))}
        description={String(
          t('Monitor the health and performance of your triggers'),
        )}
      />
      <DataTable
        emptyStateTextTitle={t('No trigger data available')}
        emptyStateTextDescription={t(
          'Trigger health information will appear here',
        )}
        emptyStateIcon={<CheckCircle class="size-14" />}
        hidePagination={true}
        columns={columns}
        page={{ data: triggerHealthData, previous: '', next: '' }}
        isLoading={isLoading}
      />
    </div>
  );
}
