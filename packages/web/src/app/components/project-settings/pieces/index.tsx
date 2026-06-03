import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { PieceType } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import { Package, Trash, Puzzle, Tag, Hash, GitBranch } from 'lucide-solid';
import { createMemo, createSignal, Show } from 'solid-js';

import { RequestTrial } from '@/app/components/request-trial';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableInputPopover } from '@/components/custom/data-table/data-table-input-popover';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { LockedAlert } from '@/components/custom/locked-alert';
import { Button } from '@/components/ui/button';
import { piecesApi, PieceIcon, piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';

import { ManagePiecesDialog } from './manage-pieces-dialog';

const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] = [
  {
    accessorKey: 'name',
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Piece')}
        icon={Puzzle}
      />
    ),
    cell: (props) => {
      return (
        <div class="text-left">
          <PieceIcon
            size={'sm'}
            border={true}
            displayName={props.row.original.displayName}
            logoUrl={props.row.original.logoUrl}
            showTooltip={false}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'displayName',
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={t('Display Name')}
        icon={Tag}
      />
    ),
    cell: (props) => {
      return <div class="text-left">{props.row.original.displayName}</div>;
    },
  },
  {
    accessorKey: 'packageName',
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
    accessorKey: 'actions',
    header: (props) => <DataTableColumnHeader column={props.column} title="" />,
    cell: (props) => {
      if (props.row.original.pieceType !== PieceType.CUSTOM) {
        return null;
      }
      return (
        <ConfirmationDeleteDialog
          title={t('Delete {name}', { name: String(props.row.original.name) })}
          entityName={t('Piece')}
          message={String(
            t(
              'This will permanently delete this piece, all steps using it will fail.',
            ),
          )}
          mutationFn={async () => {
            props.row.original.delete();
            await piecesApi.delete(props.row.original.id!);
          }}
        >
          <div class="flex items-end justify-end">
            <Button variant="ghost" class="size-8 p-0">
              <Trash class="size-4 text-destructive" />
            </Button>
          </div>
        </ConfirmationDeleteDialog>
      );
    },
  },
];

const PiecesSettings = () => {
  const current = platformHooks.useCurrentPlatform();
  const [searchQuery, setSearchQuery] = createSignal('');
  const result = piecesHooks.usePieces({
    searchQuery,
    isTableQuery: true,
  });

  const toolbarButtons = createMemo(() => [
    <ManagePiecesDialog key="manage" onSuccess={() => void result.refetch()} />,
  ]);

  const customFilters = createMemo(() => [
    <DataTableInputPopover
      key="search"
      title={t('Piece Name')}
      filterValue={searchQuery}
      handleFilterChange={setSearchQuery}
    />,
  ]);

  return (
    <div class="space-y-6">
      {
        <Show when={!current.platform.plan.managePiecesEnabled}>
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
      }
      <DataTable
        emptyStateTextTitle={t('No pieces found')}
        emptyStateTextDescription={t(
          'Add a piece to your project that you want to use in your automations',
        )}
        emptyStateIcon={<Package class="size-14" />}
        columns={columns}
        customFilters={customFilters}
        page={{
          data: result.pieces ?? [],
          next: null,
          previous: null,
        }}
        isLoading={result.isLoading}
        hidePagination={true}
        toolbarButtons={
          current.platform.plan.managePiecesEnabled ? toolbarButtons : []
        }
      />
    </div>
  );
};
export { PiecesSettings };
