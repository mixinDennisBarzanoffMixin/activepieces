import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import { isNil, OAuth2GrantType, PieceScope } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import { CheckIcon, Package, Hash, GitBranch, Puzzle } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { RequestTrial } from '@/app/components/request-trial';
import { ApplyTags } from '@/app/routes/platform/setup/pieces/apply-tags';
import { PieceActions } from '@/app/routes/platform/setup/pieces/piece-actions';
import { SyncPiecesButton } from '@/app/routes/platform/setup/pieces/sync-pieces';
import { ConfigurePieceOAuth2Dialog } from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { LockedAlert } from '@/components/custom/locked-alert';
import { Badge } from '@/components/ui/badge';
import { oauthAppsQueries } from '@/features/connections';
import { InstallPieceDialog, PieceIcon, piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';

const PlatformPiecesPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.managePiecesEnabled;
  const searchQuery =
    new URLSearchParams(window.location.search).get('name') ?? '';
  const {
    pieces,
    refetch: refetchPieces,
    isLoading,
  } = piecesHooks.usePieces({
    searchQuery,
    includeTags: true,
    includeHidden: true,
    isTableQuery: true,
  });

  const { refetch: refetchPiecesOAuth2AppsMap } =
    oauthAppsQueries.usePiecesOAuth2AppsMap();

  const columns = createMemo<
    ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[]
  >(() => [
    {
      accessorKey: 'displayName',
      size: 300,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Name')}
          icon={Puzzle}
        />
      ),
      cell: (props) => {
        return (
          <div class="flex items-center gap-2">
            <PieceIcon
              size={'sm'}
              border={true}
              displayName={props.row.original.displayName}
              logoUrl={props.row.original.logoUrl}
              showTooltip={false}
            />
            <div class="flex flex-col gap-0.5">
              <span>{props.row.original.displayName}</span>
              <Show
                when={
                  props.row.original.tags && props.row.original.tags.length > 0
                }
              >
                <div class="flex gap-1">
                  <For each={props.row.original.tags}>
                    {(tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        class="text-xs py-0 px-1.5"
                      >
                        {tag}
                      </Badge>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'packageName',
      size: 250,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Package Name')}
          icon={Hash}
        />
      ),
      cell: (props) => {
        return <div class="text-left">{props.row.original.name}</div>;
      },
    },
    {
      accessorKey: 'version',
      size: 80,
      header: (props) => (
        <DataTableColumnHeader
          column={props.column}
          title={t('Version')}
          icon={GitBranch}
        />
      ),
      cell: (props) => {
        return <div class="text-left">{props.row.original.version}</div>;
      },
    },
    {
      id: 'actions',
      size: 80,
      cell: (props) => {
        return (
          <div class="flex justify-end">
            <Show when={shouldShowOauth2SettingForPiece(props.row.original)}>
              <ConfigurePieceOAuth2Dialog
                pieceName={props.row.original.name}
                onConfigurationDone={() => {
                  void refetchPieces();
                  void refetchPiecesOAuth2AppsMap();
                }}
                isEnabled={isEnabled}
              />
            </Show>
            <PieceActions
              pieceName={props.row.original.name}
              isEnabled={isEnabled}
            />
          </div>
        );
      },
    },
  ]);

  return (
    <>
      <DashboardPageHeader
        description={String(
          t('Manage the pieces that are available to your users'),
        )}
        title={String(t('Pieces'))}
      />
      <div class="mx-auto w-full flex flex-col flex-1 min-h-0">
        <Show when={!isEnabled}>
          <LockedAlert
            title={t('Control Pieces')}
            description={t(
              "Show the pieces that matter most to your users and hide the ones you don't like.",
            )}
            button={
              <RequestTrial
                featureKey="ENTERPRISE_PIECES"
                buttonVariant="basic"
              />
            }
          />
        </Show>
        <DataTable
          emptyStateTextTitle={t('No pieces found')}
          emptyStateTextDescription={t(
            'Start by installing pieces that you want to use in your automations',
          )}
          emptyStateIcon={<Package class="size-14" />}
          columns={columns()}
          filters={[
            {
              type: 'input',
              title: t('Piece Name'),
              accessorKey: 'name',
              icon: CheckIcon,
            },
          ]}
          page={{
            data: pieces ?? [],
            next: null,
            previous: null,
          }}
          isLoading={isLoading}
          bulkActions={[
            {
              render: (selectedRows) => (
                <ApplyTags
                  selectedPieces={selectedRows}
                  onApplyTags={() => void refetchPieces()}
                />
              ),
            },
          ]}
          toolbarButtons={[
            <SyncPiecesButton key="sync" />,
            <InstallPieceDialog
              key="install"
              onInstallPiece={() => void refetchPieces()}
              scope={PieceScope.PLATFORM}
            />,
          ]}
          selectColumn={true}
          virtualizeRows={true}
          hidePagination={true}
        />
      </div>
    </>
  );
};

export { PlatformPiecesPage };

function shouldShowOauth2SettingForPiece(piece: PieceMetadataModelSummary) {
  const pieceAuth = Array.isArray(piece.auth)
    ? piece.auth.find((auth) => auth.type === PropertyType.OAUTH2)
    : piece.auth;
  if (isNil(pieceAuth)) {
    return false;
  }
  if (pieceAuth.type !== PropertyType.OAUTH2) {
    return false;
  }
  if (pieceAuth.grantType === OAuth2GrantType.CLIENT_CREDENTIALS) {
    return false;
  }
  return true;
}
