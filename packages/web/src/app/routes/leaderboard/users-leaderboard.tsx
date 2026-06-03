import { BADGES, UserWithBadges } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import { Trophy } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { RankCell } from './projects-leaderboard';

export type UserStats = {
  id: string;
  visibleId: string;
  userName: string;
  userEmail: string;
  flowCount: number;
  minutesSaved: number;
  badges?: UserWithBadges['badges'];
  rank: number;
};

type UsersLeaderboardProps = {
  data: UserStats[];
  isLoading?: boolean;
};

const BadgesCell = (props: {
  badges?: UserWithBadges['badges'];
  isTopRank: boolean;
}) => (
  <Show
    when={props.badges && props.badges.length > 0}
    fallback={<span class="text-muted-foreground">-</span>}
  >
    <div class="flex items-center gap-0.5">
      <For each={props.badges}>
        {(badge) => {
          const badgeInfo = BADGES[badge.name as keyof typeof BADGES];
          return (
            <Tooltip key={badge.name}>
              <TooltipTrigger asChild>
                <img
                  src={badgeInfo.imageUrl}
                  alt={badgeInfo.title}
                  class={cn(
                    'h-7 w-7 object-cover rounded-md transition-opacity',
                    !props.isTopRank &&
                      'opacity-30 group-hover/leaderrow:opacity-100',
                  )}
                />
              </TooltipTrigger>
              <TooltipContent class="text-left">
                <p class="font-semibold">{badgeInfo.title}</p>
                <p class="text-xs">{badgeInfo.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        }}
      </For>
    </div>
  </Show>
);

const createColumns = (): ColumnDef<RowDataWithActions<UserStats>>[] => [
  {
    accessorKey: 'rank',
    header: (props) => (
      <DataTableColumnHeader column={props.column} title={t('Rank')} />
    ),
    cell: (props) => <RankCell rank={props.row.original.rank} />,
    enableSorting: false,
    size: 25,
  },
  {
    accessorKey: 'userName',
    header: (props) => (
      <DataTableColumnHeader column={props.column} title={t('User')} />
    ),
    cell: (props) => (
      <div class="flex items-center gap-3">
        <ApAvatar
          id={props.row.original.visibleId}
          size="small"
          includeAvatar={true}
          includeName={true}
        />
      </div>
    ),
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
    size: 120,
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
    size: 120,
  },
  {
    accessorKey: 'badges',
    header: (props) => (
      <DataTableColumnHeader column={props.column} title={t('Badges')} />
    ),
    cell: (props) => (
      <BadgesCell
        badges={props.row.original.badges}
        isTopRank={props.row.original.rank <= 3}
      />
    ),
    enableSorting: false,
  },
];

const getRowClassName = (
  row: RowDataWithActions<UserStats>,
  _index: number,
) => {
  if (row.rank <= 3) return 'group/leaderrow bg-primary/5 hover:bg-primary/10';
  return 'group/leaderrow hover:bg-accent';
};

export function UsersLeaderboard(props: UsersLeaderboardProps) {
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
      emptyStateTextTitle={t('No automation heroes yet')}
      emptyStateTextDescription={t(
        'Once your team starts building flows, their achievements will shine here',
      )}
      emptyStateIcon={<Trophy class="h-10 w-10 text-muted-foreground" />}
    />
  );
}
