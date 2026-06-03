import { ColorName, PROJECT_COLOR_PALETTE } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import { Rocket } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Avatar } from '@/components/ui/avatar';
import { formatUtils } from '@/lib/format-utils';

import { FirstIcon } from './icons/1st-icon';
import { SecondIcon } from './icons/2nd-icon';
import { ThirdIcon } from './icons/3rd-icon';

export type ProjectStats = {
  id: string;
  projectId: string;
  projectName: string;
  flowCount: number;
  minutesSaved: number;
  iconColor?: ColorName;
  rank: number;
};

type ProjectsLeaderboardProps = {
  data: ProjectStats[];
  isLoading?: boolean;
};

export const getRankIcon = (rank: number) => {
  if (rank === 1) return <FirstIcon class="size-6" />;
  if (rank === 2) return <SecondIcon class="size-6" />;
  if (rank === 3) return <ThirdIcon class="size-6" />;
  return null;
};

export const getRankText = (rank: number) => {
  return rank <= 3 ? null : `#${rank}`;
};

export function RankCell(props: { rank: number }) {
  const icon = getRankIcon(props.rank);
  return (
    <div class="flex items-center gap-2 shrink-0">
      <Show when={icon}>
        <div>{icon}</div>
      </Show>
      <span class="text-sm text-foreground">{getRankText(props.rank)}</span>
    </div>
  );
}

const createColumns = (): ColumnDef<RowDataWithActions<ProjectStats>>[] => [
  {
    accessorKey: 'rank',
    header: (props) => (
      <DataTableColumnHeader column={props.column} title={t('Rank')} />
    ),
    cell: (props) => <RankCell rank={props.row.original.rank} />,
    enableSorting: false,
    size: 20,
  },
  {
    accessorKey: 'projectName',
    header: (props) => (
      <DataTableColumnHeader column={props.column} title={t('Projects')} />
    ),
    cell: (props) => {
      const palette = props.row.original.iconColor
        ? PROJECT_COLOR_PALETTE[props.row.original.iconColor]
        : PROJECT_COLOR_PALETTE[ColorName.BLUE];
      return (
        <div class="flex items-center gap-2">
          <Avatar
            class="size-6 text-xs font-medium flex items-center justify-center rounded-sm shrink-0"
            style={{
              'background-color': palette.color,
              color: palette.textColor,
            }}
          >
            {props.row.original.projectName.charAt(0).toUpperCase()}
          </Avatar>
          <p class="h-8 flex items-center">{props.row.original.projectName}</p>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'flowCount',
    header: (props) => (
      <DataTableColumnHeader column={props.column} title={t('Active Flows')} />
    ),
    cell: (props) => (
      <div class="text-left">{props.row.original.flowCount}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'minutesSaved',
    header: (props) => (
      <DataTableColumnHeader column={props.column} title={t('Time Saved')} />
    ),
    cell: (props) => (
      <div class="text-left">
        {formatUtils.formatToHoursAndMinutes(props.row.original.minutesSaved)}
      </div>
    ),
    enableSorting: false,
  },
];

const getRowClassName = (
  row: RowDataWithActions<ProjectStats>,
  _index: number,
) => {
  if (row.rank <= 3) return 'bg-primary/5 hover:bg-primary/10';
  return 'hover:bg-accent';
};

export function ProjectsLeaderboard(props: ProjectsLeaderboardProps) {
  const columns = createMemo(() => createColumns());

  return (
    <DataTable
      columns={columns()}
      page={{
        data: props.data,
        next: null,
        previous: null,
      }}
      isLoading={props.isLoading ?? false}
      clientPagination={true}
      getRowClassName={getRowClassName}
      emptyStateTextTitle={t('No projects on the board yet')}
      emptyStateTextDescription={t(
        'Projects will rank here as flows are created and time is saved',
      )}
      emptyStateIcon={<Rocket class="h-10 w-10 text-muted-foreground" />}
      onRowClick={(row) => {
        window.open(`/projects/${row.projectId}`, '_blank');
      }}
    />
  );
}
