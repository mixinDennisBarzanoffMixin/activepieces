import {
  isNil,
  PlatformWithoutSensitiveData,
  ProjectWithLimits,
  ProjectType,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import {
  Lock,
  User,
  Tag,
  Users,
  Workflow,
  Clock,
  Hash,
  Link2,
} from 'lucide-solid';
import { Show } from 'solid-js';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';

type ProjectsTableColumnsProps = {
  platform: PlatformWithoutSensitiveData;
};

export const projectsTableColumns = ({
  platform,
}: ProjectsTableColumnsProps): ColumnDef<
  RowDataWithActions<ProjectWithLimits & { globalConnectionsCount: number }>
>[] => {
  const columns: ColumnDef<
    RowDataWithActions<ProjectWithLimits & { globalConnectionsCount: number }>
  >[] = [
    {
      accessorKey: 'displayName',
      size: 270,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Name')}
          icon={Tag}
        />
      ),
      cell: (props) => {
        const locked = props.row.original.plan.locked;
        const isPersonal = props.row.original.type === ProjectType.PERSONAL;

        return (
          <div class="text-left flex items-center justify-start ">
            <Show when={locked}>
              <Lock class="size-3 mr-1.5" strokeWidth={2.5} />
            </Show>
            <Show when={isPersonal}>
              <User class="size-4 mr-1.5" />
            </Show>
            <span class="font-medium">{props.row.original.displayName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      enableHiding: true,
    },
    {
      accessorKey: 'users',
      size: 120,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Active Users')}
          icon={Users}
          class="w-full"
        />
      ),
      cell: (props) => {
        return (
          <div class="text-left tabular-nums">
            <span class="font-medium">
              {props.row.original.analytics.activeUsers}
            </span>
            <span class="text-muted-foreground">
              {` / ${props.row.original.analytics.totalUsers}`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'flows',
      size: 120,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Active Flows')}
          icon={Workflow}
          class="w-full"
        />
      ),
      cell: (props) => {
        return (
          <div class="text-left tabular-nums">
            <span class="font-medium">
              {props.row.original.analytics.activeFlows}
            </span>
            <span class="text-muted-foreground">
              {` / ${props.row.original.analytics.totalFlows}`}
            </span>
          </div>
        );
      },
    },
  ];

  if (platform.plan.embeddingEnabled) {
    columns.push({
      accessorKey: 'externalId',
      size: 150,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('External ID')}
          icon={Hash}
        />
      ),
      cell: (props) => {
        const displayValue =
          isNil(props.row.original.externalId) ||
          props.row.original.externalId.length === 0
            ? '-'
            : props.row.original.externalId;
        return <div class="text-left truncate">{displayValue}</div>;
      },
    });
  }
  if (platform.plan.globalConnectionsEnabled) {
    columns.push({
      accessorKey: 'globalConnectionsCount',
      size: 135,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Global Connections')}
          icon={Link2}
          class="w-full"
        />
      ),
      cell: (props) => {
        return (
          <div class="text-left tabular-nums">
            {props.row.original.globalConnectionsCount}
          </div>
        );
      },
    });
  }

  columns.push({
    accessorKey: 'createdAt',
    size: 110,
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Created')}
        icon={Clock}
      />
    ),
    cell: (props) => {
      return (
        <div class="text-left">
          <FormattedDate date={new Date(props.row.original.created)} />
        </div>
      );
    },
  });

  return columns;
};
