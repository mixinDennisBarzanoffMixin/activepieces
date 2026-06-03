import {
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  Permission,
  PlatformRole,
} from '@activepieces/shared';
import { useLocation, useNavigate } from '@solidjs/router';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import {
  CheckIcon,
  Globe,
  Trash2,
  Clock,
  Activity,
  Workflow,
  Puzzle,
} from 'lucide-solid';
import { createMemo, createSignal, Show } from 'solid-js';

import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
import { ReplaceConnectionsDialog } from '@/app/connections/replace-connections-dialog';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { FormattedDate } from '@/components/custom/formatted-date';
import { DeleteConnectionWarning } from '@/components/custom/global-connection-utils';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { PlusIcon } from '@/components/icons/plus';
import { ReplaceIcon } from '@/components/icons/replace';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  EditGlobalConnectionDialog,
  RenameConnectionDialog,
  appConnectionsMutations,
  appConnectionsQueries,
  appConnectionUtils,
} from '@/features/connections';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { ownerColumnHooks } from '@/hooks/owner-column-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';

function AppConnectionsPage() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = createSignal(0);
  const [selectedRows, setSelectedRows] = createSignal<
    Array<AppConnectionWithoutSensitiveData>
  >([]);
  const [showDeleteDialog, setShowDeleteDialog] = createSignal(false);
  const { checkAccess } = useAuthorization();
  const userPlatformRole = userHooks.getCurrentUserPlatformRole();
  const location = useLocation();
  const { pieces } = piecesHooks.usePieces({});
  const pieceOptions = (pieces ?? []).map((piece) => ({
    label: piece.displayName,
    value: piece.name,
  }));
  const projectId = authenticationSession.getProjectId()!;

  const searchParams = new URLSearchParams(location.search);
  const cursor = searchParams.get(CURSOR_QUERY_PARAM) ?? undefined;
  const limit = searchParams.get(LIMIT_QUERY_PARAM)
    ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
    : 10;
  const status = searchParams.getAll('status') as AppConnectionStatus[];
  const pieceName = searchParams.get('pieceName') ?? undefined;
  const displayName = searchParams.get('displayName') ?? undefined;

  const {
    data: connections,
    isLoading: connectionsLoading,
    refetch,
  } = appConnectionsQueries.useAppConnections({
    request: {
      projectId,
      cursor,
      limit,
      status,
      pieceName,
      displayName,
    },
    extraKeys: [location.search, projectId],
    showErrorDialog: true,
  });

  const { mutateAsync: deleteConnections } =
    appConnectionsMutations.useBulkDeleteAppConnections(() => {
      void refetch();
    });

  const filteredData = createMemo(() => {
    if (!connections?.data) return undefined;
    const searchParams = new URLSearchParams(location.search);
    const ownerEmails = searchParams.getAll('owner');

    if (ownerEmails.length === 0) return connections;

    return {
      data: connections.data.filter(
        (conn) => conn.owner && ownerEmails.includes(conn.owner.email),
      ),
      next: connections.next,
      previous: connections.previous,
    };
  });

  const userHasPermissionToWriteAppConnection = checkAccess(
    Permission.WRITE_APP_CONNECTION,
  );
  const { data: owners } = appConnectionsQueries.useConnectionsOwners();
  const filters: DataTableFilters<keyof AppConnectionWithoutSensitiveData>[] =
    ownerColumnHooks.useOwnerColumnFilter<AppConnectionWithoutSensitiveData>(
      [
        {
          type: 'select',
          title: t('Status'),
          accessorKey: 'status',
          options: Object.values(AppConnectionStatus).map((status) => {
            return {
              label: formatUtils.convertEnumToHumanReadable(status),
              value: status,
            };
          }),
          icon: CheckIcon,
        },
        {
          type: 'select',
          title: t('Pieces'),
          accessorKey: 'pieceName',
          icon: Puzzle,
          options: pieceOptions,
        },
        {
          type: 'input',
          title: t('Name'),
          accessorKey: 'displayName',
          icon: Puzzle,
        },
      ],
      4,
      owners,
    );

  const columns: ColumnDef<
    RowDataWithActions<AppConnectionWithoutSensitiveData>,
    unknown
  >[] = ownerColumnHooks.useOwnerColumn<AppConnectionWithoutSensitiveData>(
    [
      {
        accessorKey: 'displayName',
        size: 280,
        header: (props) => (
          <DataTableColumnHeader
            column={props.column}
            title={t('Name')}
            icon={Puzzle}
          />
        ),
        cell: (props) => {
          const platform = () =>
            props.row.original.scope === AppConnectionScope.PLATFORM;
          return (
            <div class="flex items-center gap-2">
              <CopyTextTooltip
                title={t('External ID')}
                text={props.row.original.externalId || ''}
              >
                <div class="flex items-center gap-2 w-fit">
                  <PieceIconWithPieceName
                    pieceName={props.row.original.pieceName}
                    showTooltip={false}
                    size="sm"
                  />
                  <span class="truncate max-w-[120px] 2xl:max-w-[250px]">
                    {props.row.original.displayName}
                  </span>
                </div>
              </CopyTextTooltip>
              <Show when={platform()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Globe class="w-4 h-4 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {t(
                        'This connection is global and can be managed in the platform admin',
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Show>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        size: 120,
        header: (props) => (
          <DataTableColumnHeader
            column={props.column}
            title={t('Status')}
            icon={Activity}
          />
        ),
        cell: (props) => {
          const status = () => props.row.original.status;
          const icon = createMemo(() =>
            appConnectionUtils.getStatusIcon(status()),
          );
          return (
            <div class="text-left">
              <StatusIconWithText
                icon={icon().icon}
                text={formatUtils.convertEnumToHumanReadable(status())}
                variant={icon().variant}
              />
            </div>
          );
        },
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
        cell: (props) => {
          return (
            <div class="text-left">
              <FormattedDate date={new Date(props.row.original.updated)} />
            </div>
          );
        },
      },
      {
        accessorKey: 'flowCount',
        size: 80,
        header: (props) => (
          <DataTableColumnHeader
            column={props.column}
            title={t('Flows')}
            icon={Workflow}
          />
        ),
        cell: (props) => {
          return (
            <div
              class="text-left underline cursor-pointer"
              onClick={() => {
                navigate(
                  `/flows?connectionExternalId=${props.row.original.externalId}`,
                );
              }}
            >
              {props.row.original.flowIds?.length}
            </div>
          );
        },
      },
      {
        id: 'actions',
        size: 100,
        cell: (props) => {
          const platform = () =>
            props.row.original.scope === AppConnectionScope.PLATFORM;
          const rename = createMemo(() =>
            platform()
              ? userPlatformRole === PlatformRole.ADMIN
              : userHasPermissionToWriteAppConnection,
          );
          return (
            <div class="flex items-center gap-2 justify-end">
              <Show
                when={props.row.original.scope === AppConnectionScope.PROJECT}
                fallback={
                  <EditGlobalConnectionDialog
                    connectionId={props.row.original.id}
                    currentName={props.row.original.displayName}
                    projectIds={props.row.original.projectIds}
                    userHasPermissionToEdit={rename()}
                    onEdit={() => {
                      void refetch();
                    }}
                    preSelectForNewProjects={
                      props.row.original.preSelectForNewProjects
                    }
                  />
                }
              >
                <RenameConnectionDialog
                  connectionId={props.row.original.id}
                  currentName={props.row.original.displayName}
                  onRename={() => {
                    void refetch();
                  }}
                  userHasPermissionToRename={rename()}
                />
              </Show>
              <ReconnectButtonDialog
                hasPermission={rename()}
                connection={props.row.original}
                onConnectionCreated={() => {
                  void refetch();
                }}
              />
            </div>
          );
        },
      },
    ],
    4,
  );

  const bulkActions: BulkAction<AppConnectionWithoutSensitiveData>[] =
    createMemo(() => [
      {
        render: (
          _rows: RowDataWithActions<AppConnectionWithoutSensitiveData>[],
          resetSelection: () => void,
        ) => {
          return (
            <>
              <Show when={selectedRows().length > 0}>
                <ConfirmationDeleteDialog
                  title={t('Delete Connections')}
                  message={String(
                    t('The selected connections will be permanently deleted.'),
                  )}
                  warning={<DeleteConnectionWarning />}
                  mutationFn={() =>
                    deleteConnections(selectedRows().map((row) => row.id)).then(
                      () => {
                        void refetch();
                        resetSelection();
                        setSelectedRows([]);
                      },
                    )
                  }
                  entityName={t('connection')}
                  buttonText={t('Delete')}
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                  showToast
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive hover:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 class="h-4 w-4 mr-1" />
                    {t('Delete')} ({selectedRows().length})
                  </Button>
                </ConfirmationDeleteDialog>
              </Show>
            </>
          );
        },
      },
    ]);

  const toolbarButtons = createMemo(() => [
    <PermissionNeededTooltip
      key="replace"
      hasPermission={userHasPermissionToWriteAppConnection}
    >
      <ReplaceConnectionsDialog
        projectId={projectId}
        onConnectionMerged={() => {
          setRefresh(refresh() + 1);
          void refetch();
        }}
      >
        <AnimatedIconButton
          icon={ReplaceIcon}
          iconSize={16}
          variant="outline"
          disabled={!userHasPermissionToWriteAppConnection}
        >
          {t('Replace')}
        </AnimatedIconButton>
      </ReplaceConnectionsDialog>
    </PermissionNeededTooltip>,
    <PermissionNeededTooltip
      key="new"
      hasPermission={userHasPermissionToWriteAppConnection}
    >
      <NewConnectionDialog
        isGlobalConnection={false}
        onConnectionCreated={() => {
          setRefresh(refresh() + 1);
          void refetch();
        }}
      >
        <AnimatedIconButton
          icon={PlusIcon}
          iconSize={16}
          size="sm"
          disabled={!userHasPermissionToWriteAppConnection}
        >
          {t('New Connection')}
        </AnimatedIconButton>
      </NewConnectionDialog>
    </PermissionNeededTooltip>,
  ]);
  return (
    <div class="flex-col w-full">
      <DataTable
        emptyStateTextTitle={t('No connections found')}
        emptyStateTextDescription={t(
          'Come back later when you create a automation to manage your connections',
        )}
        emptyStateIcon={<Globe class="size-14" />}
        columns={columns}
        page={filteredData}
        isLoading={connectionsLoading}
        filters={filters}
        selectColumn={true}
        onSelectedRowsChange={setSelectedRows}
        bulkActions={bulkActions}
        toolbarButtons={toolbarButtons}
      />
    </div>
  );
}

export { AppConnectionsPage };
