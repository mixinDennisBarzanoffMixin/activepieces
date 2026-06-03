import {
  SECRET_MANAGER_PROVIDERS_METADATA,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import {
  KeyRound,
  Pencil,
  RefreshCcw,
  Trash,
  Globe,
  Activity,
  XIcon,
} from 'lucide-solid';
import { Show } from 'solid-js';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { PlusIcon } from '@/components/icons/plus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces';
import { secretManagersHooks } from '@/features/secret-managers';
import { platformHooks } from '@/hooks/platform-hooks';

import AddEditSecretManagerConnectionDialog from './connect-secret-manager-dialog';

const SecretManagersPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: connections, isLoading: isLoadingConnections } =
    secretManagersHooks.useListSecretManagerConnections({
      listForPlatform: true,
      showErrorDialog: true,
    });
  const { mutate: deleteConnection } =
    secretManagersHooks.useDeleteSecretManagerConnection();

  const isLoading = isLoadingConnections;

  const page = connections
    ? { data: connections, next: null, previous: null }
    : undefined;

  const columns: ColumnDef<
    RowDataWithActions<SecretManagerConnectionWithStatus>,
    unknown
  >[] = [
    {
      accessorKey: 'name',
      size: 240,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Name')}
          icon={KeyRound}
        />
      ),
      cell: (props) => {
        const provider = () =>
          SECRET_MANAGER_PROVIDERS_METADATA.find(
            (item) => item.id === props.row.original.providerId,
          );
        return (
          <div class="flex items-center gap-2 w-fit">
            <PieceIcon
              size="md"
              border={true}
              displayName={provider()?.name}
              logoUrl={provider()?.logo}
              showTooltip={true}
            />
            <span>{props.row.original.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'scope',
      size: 100,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Scope')}
          icon={Globe}
        />
      ),
      cell: (props) => (
        <Show
          when={
            props.row.original.scope === SecretManagerConnectionScope.PLATFORM
          }
          fallback={
            <Badge variant="outline" class="text-xs">
              {t('Project')}
            </Badge>
          }
        >
          <Badge variant="outline" class="text-xs">
            {t('Platform')}
          </Badge>
        </Show>
      ),
    },
    {
      accessorKey: 'connection',
      size: 100,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Status')}
          icon={Activity}
        />
      ),
      cell: (props) => (
        <Show
          when={props.row.original.connection.configured}
          fallback={
            <Badge variant="outline" class="text-xs text-muted-foreground">
              {t('Not configured')}
            </Badge>
          }
        >
          <Show
            when={props.row.original.connection.connected}
            fallback={
              <StatusIconWithText
                icon={XIcon}
                text={t('Disconnected')}
                variant="error"
              />
            }
          >
            <StatusIconWithText
              icon={Activity}
              text={t('Connected')}
              variant="success"
            />
          </Show>
        </Show>
      ),
    },
    {
      id: 'actions',
      cell: (props) => (
        <div class="flex items-center gap-1 justify-end">
          <AddEditSecretManagerConnectionDialog connection={props.row.original}>
            <Button variant="ghost" size="sm">
              <Pencil class="size-4" />
            </Button>
          </AddEditSecretManagerConnectionDialog>
          <SecretManagerClearCacheButton connection={props.row.original} />
          <ConfirmationDeleteDialog
            title={t('Delete Connection')}
            message={String(
              t(
                'Are you sure you want to delete this secret manager connection?',
              ),
            )}
            warning={String(
              t(
                'Deleting this secret manager connection will break all flows/app connections using it.',
              ),
            )}
            entityName={props.row.original.name}
            mutationFn={() => {
              deleteConnection(props.row.original.id);
            }}
          >
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash class="size-4 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Delete')}</TooltipContent>
              </Tooltip>
            </div>
          </ConfirmationDeleteDialog>
        </div>
      ),
    },
  ];

  return (
    <LockedFeatureGuard
      featureKey="SECRET_MANAGERS"
      locked={!platform.plan.secretManagersEnabled}
      lockTitle={t('Enable Secret Managers')}
      lockDescription={t('Manage your secrets from a single and secure place')}
    >
      <div class="flex-col w-full">
        <DashboardPageHeader
          title={String(t('Secret Managers'))}
          description={String(t('Manage Secret Manager connections'))}
        >
          <AddEditSecretManagerConnectionDialog>
            <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
              {t('New Connection')}
            </AnimatedIconButton>
          </AddEditSecretManagerConnectionDialog>
        </DashboardPageHeader>
        <DataTable
          emptyStateTextTitle={t('No connections found')}
          emptyStateTextDescription={t(
            'Add a secret manager connection to manage your secrets',
          )}
          emptyStateIcon={<KeyRound class="size-14" />}
          columns={columns}
          page={page}
          isLoading={isLoading}
          hidePagination={true}
        />
      </div>
    </LockedFeatureGuard>
  );
};

export default SecretManagersPage;

const SecretManagerClearCacheButton = (props: {
  connection: SecretManagerConnectionWithStatus;
}) => {
  const { mutate: clearCache, isPending: isClearingCache } =
    secretManagersHooks.useClearCache();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          loading={isClearingCache}
          onClick={() => clearCache(props.connection.id)}
        >
          <RefreshCcw class="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('Clear Cache')}</TooltipContent>
    </Tooltip>
  );
};
