import {
  AppConnectionScope,
  AppConnectionStatus,
  MAX_PLATFORM_APP_CONNECTION_OWNERS,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { A as Link } from '@solidjs/router';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import {
  Activity,
  CheckIcon,
  Clock,
  Folder,
  Globe,
  Puzzle,
  Shield,
  Unplug,
  User,
} from 'lucide-solid';
import { For, Show } from 'solid-js';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import {
  DataTable,
  DataTableFilters,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { appConnectionUtils } from '@/features/connections';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import { platformAppConnectionsQueries } from '@/features/platform-admin/hooks/platform-app-connections-hooks';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { formatUtils } from '@/lib/format-utils';

export default function PlatformConnectionsPage() {
  const { data: connections, isLoading } =
    platformAppConnectionsQueries.useList();
  const { data: owners } = platformAppConnectionsQueries.useOwners();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const { pieces } = piecesHooks.usePieces({});
  const title = String(t('Connections'));
  const desc = String(
    t('All app connections across every project on this platform'),
  );

  const filters: DataTableFilters<
    keyof PlatformAppConnectionsListItem | 'ownerIds'
  >[] = [
    {
      type: 'input',
      title: t('Name'),
      accessorKey: 'displayName',
      icon: Unplug,
    },
    {
      type: 'select',
      title: t('Status'),
      accessorKey: 'status',
      icon: CheckIcon,
      options: Object.values(AppConnectionStatus).map((status) => ({
        label: formatUtils.convertEnumToHumanReadable(status),
        value: status,
      })),
    },
    {
      type: 'select',
      title: t('Piece'),
      accessorKey: 'pieceName',
      icon: Puzzle,
      options: (pieces ?? []).map((piece) => ({
        label: piece.displayName,
        value: piece.name,
      })),
    },
    {
      type: 'select',
      title: t('Project'),
      accessorKey: 'projectIds',
      icon: Folder,
      options: (projects ?? []).map((project) => ({
        label: getProjectName(project),
        value: project.id,
      })),
    },
    {
      type: 'select',
      title: t('Owner'),
      accessorKey: 'ownerIds',
      icon: User,
      options: (owners?.data ?? []).map((owner) => ({
        label: owner.email,
        value: owner.id,
      })),
    },
  ];

  const columns: ColumnDef<
    RowDataWithActions<PlatformAppConnectionsListItem>
  >[] = [
    {
      accessorKey: 'displayName',
      size: 280,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Name')}
          icon={Unplug}
        />
      ),
      cell: (props) => (
        <CopyTextTooltip
          title={t('External ID')}
          text={props.row.original.externalId || ''}
        >
          <div class="flex items-center gap-2 w-fit min-w-0">
            <PieceIconWithPieceName
              pieceName={props.row.original.pieceName}
              showTooltip={false}
              size="sm"
            />
            <TextWithTooltip tooltipMessage={props.row.original.displayName}>
              <span class="truncate max-w-[160px] 2xl:max-w-[260px]">
                {props.row.original.displayName}
              </span>
            </TextWithTooltip>
          </div>
        </CopyTextTooltip>
      ),
    },
    {
      accessorKey: 'status',
      size: 130,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Status')}
          icon={Activity}
        />
      ),
      cell: (props) => <StatusCell status={props.row.original.status} />,
    },
    {
      accessorKey: 'projects',
      size: 220,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Project')}
          icon={Folder}
        />
      ),
      cell: (props) => <ProjectsCell projects={props.row.original.projects} />,
    },
    {
      accessorKey: 'scope',
      size: 120,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Scope')}
          icon={Shield}
        />
      ),
      cell: (props) => <ScopeBadge scope={props.row.original.scope} />,
    },
    {
      accessorKey: 'owner',
      size: 200,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Owner')}
          icon={User}
        />
      ),
      cell: (props) => <OwnerCell owner={props.row.original.owner} />,
    },
    {
      accessorKey: 'updated',
      size: 150,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Connected At')}
          icon={Clock}
        />
      ),
      cell: (props) => (
        <FormattedDate date={new Date(props.row.original.updated)} />
      ),
    },
  ];

  return (
    <div class="flex flex-col w-full">
      <DashboardPageHeader title={title} description={desc} />
      <Show when={owners?.truncated}>
        <div class="px-6 pb-2 text-xs text-muted-foreground">
          {t('Owner filter is limited to the first {count} owners', {
            count: MAX_PLATFORM_APP_CONNECTION_OWNERS,
          })}
        </div>
      </Show>
      <DataTable
        emptyStateTextTitle={t('No connections found')}
        emptyStateTextDescription={t(
          'Connections created in any project on this platform will appear here.',
        )}
        emptyStateIcon={<Unplug class="size-14" />}
        columns={columns}
        page={connections}
        isLoading={isLoading}
        filters={filters}
      />
    </div>
  );
}

const StatusCell = (props: { status: AppConnectionStatus }) => {
  const icon = () => appConnectionUtils.getStatusIcon(props.status);
  return (
    <StatusIconWithText
      icon={icon().icon}
      text={formatUtils.convertEnumToHumanReadable(props.status)}
      variant={icon().variant}
    />
  );
};

const OwnerCell = (props: {
  owner: PlatformAppConnectionsListItem['owner'];
}) => {
  const label = () => {
    if (!props.owner) {
      return '';
    }
    return (
      [props.owner.firstName, props.owner.lastName].filter(Boolean).join(' ') ||
      props.owner.email
    );
  };
  return (
    <Show
      when={props.owner}
      fallback={<span class="text-muted-foreground">{t('N/A')}</span>}
    >
      {(owner) => (
        <TextWithTooltip tooltipMessage={owner().email}>
          <span class="truncate max-w-[180px]">{label()}</span>
        </TextWithTooltip>
      )}
    </Show>
  );
};

const ScopeBadge = (props: { scope: AppConnectionScope }) => (
  <Show
    when={props.scope === AppConnectionScope.PLATFORM}
    fallback={<Badge variant="outline">{t('Project')}</Badge>}
  >
    {
      <Badge variant="accent">
        <Globe />
        {t('Global')}
      </Badge>
    }
  </Show>
);

const ProjectsCell = (props: {
  projects: PlatformAppConnectionsListItem['projects'];
}) => (
  <Show
    when={props.projects.length > 0}
    fallback={<span class="text-muted-foreground">{t('N/A')}</span>}
  >
    <Show
      when={props.projects.length === 1}
      fallback={<ProjectList {...props} />}
    >
      <ProjectLink project={props.projects[0]} />
    </Show>
  </Show>
);

const ProjectLink = (props: {
  project: PlatformAppConnectionsListItem['projects'][number];
}) => {
  const name = () => getProjectName(props.project);
  return (
    <Link href={`/projects/${props.project.id}`}>
      <TextWithTooltip tooltipMessage={name()}>
        <span class="truncate max-w-[200px] text-primary hover:underline">
          {name()}
        </span>
      </TextWithTooltip>
    </Link>
  );
};

const ProjectList = (props: {
  projects: PlatformAppConnectionsListItem['projects'];
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span class="cursor-default underline decoration-dashed underline-offset-2">
        {t('{count, plural, =1 {1 project} other {# projects}}', {
          count: props.projects.length,
        })}
      </span>
    </TooltipTrigger>
    <TooltipContent>
      <ul class="flex flex-col gap-1 max-w-[260px]">
        <For each={props.projects}>
          {(project) => <li class="truncate">{getProjectName(project)}</li>}
        </For>
      </ul>
    </TooltipContent>
  </Tooltip>
);
