import { Permission, Table } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Download,
  PencilIcon,
  TrashIcon,
  UploadCloud,
  Import,
  FileJson,
} from 'lucide-solid';
import React, { createEffect, createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RenameDialog } from '@/features/automations/components/rename-dialog';
import { PushToGitDialog } from '@/features/project-releases/components/push-to-git-dialog';
import { gitSyncHooks } from '@/features/project-releases/hooks/git-sync-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { tablesApi } from '../api/tables-api';
import { tableMutations } from '../hooks/table-hooks';
import { tablesUtils } from '../utils/utils';

import { ImportTableDialog } from './import-table-dialog';

const ApTableActionsMenu = (props: {
  table: Table;
  refetch: (() => void) | null;
  onDelete?: () => void;
  children: any;
}) => {
  const [isImportTableDialogOpen, setIsImportTableDialogOpen] =
    createSignal(false);
  const [isRenameOpen, setIsRenameOpen] = createSignal(false);
  const [renameValue, setRenameValue] = createSignal('');

  createEffect(() => {
    setRenameValue(props.table.name);
  });

  const { mutate: renameTableMutate, isPending: isRenamePending } =
    tableMutations.useRenameTable({
      onSuccess: () => {
        setIsRenameOpen(false);
        props.refetch?.();
        toast.success(t('Table renamed'));
      },
    });
  const renameTable = () => {
    renameTableMutate({ tableId: props.table.id, name: renameValue() });
  };

  const userHasPermissionToUpdateTable = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const userHasPermissionToPushToGit = useAuthorization().checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );
  const showPushToGit = gitSyncHooks.useShowPushToGit();

  const exportTemplate = async () => {
    const tableTemplate = await tablesApi.getTemplate(props.table.id);
    const { downloadFile } = await import('@/lib/dom-utils');
    void downloadFile({
      obj: JSON.stringify(tableTemplate, null, 2),
      fileName: tableTemplate.name,
      extension: 'json',
    });
  };

  const downloadCsv = async () => {
    const exportedTable = await tablesApi.export(props.table.id);
    tablesUtils.exportTables([exportedTable]);
  };
  return (
    <>
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>{props.children}</DropdownMenuTrigger>
        <DropdownMenuContent>
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateTable}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToUpdateTable}
              onSelect={(e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                setRenameValue(props.table.name);
                setIsRenameOpen(true);
              }}
            >
              <div class="flex items-center gap-2">
                <PencilIcon class="h-4 w-4" />
                {t('Rename')}
              </div>
            </DropdownMenuItem>
          </PermissionNeededTooltip>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setIsImportTableDialogOpen(true)}>
            <Import class="mr-2 h-4 w-4" />
            {t('Import')}
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              void exportTemplate();
            }}
          >
            <FileJson class="mr-2 h-4 w-4" />
            {t('Export Template')}
          </DropdownMenuItem>

          <Show when={showPushToGit}>
            <>
              <DropdownMenuSeparator />
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToPushToGit}
              >
                <PushToGitDialog type="table" tables={[props.table]}>
                  <DropdownMenuItem
                    disabled={!userHasPermissionToPushToGit}
                    onSelect={(e: Event) => {
                      e.preventDefault();
                    }}
                    onClick={(e: Event) => {
                      e.stopPropagation();
                    }}
                  >
                    <UploadCloud class="mr-2 h-4 w-4" />
                    {t('Push to Git')}
                  </DropdownMenuItem>
                </PushToGitDialog>
              </PermissionNeededTooltip>
              <DropdownMenuSeparator />
            </>
          </Show>
          <Show when={!showPushToGit}>
            <DropdownMenuSeparator />
          </Show>

          <DropdownMenuItem
            onSelect={() => {
              void downloadCsv();
            }}
          >
            <Download class="mr-2 h-4 w-4" />
            {t('Download Data')}
          </DropdownMenuItem>

          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateTable}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToUpdateTable}
              onSelect={(e: Event) => {
                e.preventDefault();
              }}
              onClick={(e: Event) => {
                e.stopPropagation();
              }}
            >
              <ConfirmationDeleteDialog
                title={t('Delete Table')}
                message={String(
                  t('This table and all its data will be permanently deleted.'),
                )}
                entityName={props.table.name}
                buttonText={t('Delete')}
                mutationFn={() => {
                  void tablesApi.delete(props.table.id);
                  props.onDelete?.();
                  props.refetch?.();
                }}
              >
                <div class="flex items-center gap-2 text-destructive">
                  <TrashIcon class="h-4 w-4" />
                  {t('Delete')}
                </div>
              </ConfirmationDeleteDialog>
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        </DropdownMenuContent>
      </DropdownMenu>
      <ImportTableDialog
        open={isImportTableDialogOpen}
        setIsOpen={setIsImportTableDialogOpen}
        showTrigger={false}
        tableId={props.table.id}
        allowedFileTypes={['json', 'csv']}
        onImportSuccess={() => {
          props.refetch?.();
        }}
      />
      <RenameDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        value={renameValue}
        onInput={setRenameValue}
        onConfirm={() => renameTable()}
        isRenaming={isRenamePending}
      />
    </>
  );
};

export { ApTableActionsMenu };
