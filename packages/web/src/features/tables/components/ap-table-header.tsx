import { Permission } from '@activepieces/shared';
import { t } from 'i18next';
import {
  ChevronDown,
  RefreshCw,
  Trash2,
  Download,
  UploadCloud,
  Edit2,
  Import,
  FileJson,
  Lock,
} from 'lucide-solid';
import { Show, createSignal } from 'solid-js';

import { ActiveUsersWidget } from '@/components/custom/active-users-widget';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import EditableText from '@/components/custom/editable-text';
import { PageHeader } from '@/components/custom/page-header';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PushToGitDialog } from '@/features/project-releases/components/push-to-git-dialog';
import { gitSyncHooks } from '@/features/project-releases/hooks/git-sync-hooks';
import {
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { downloadFile } from '@/lib/dom-utils';

import { tablesApi } from '../api/tables-api';
import { tablesUtils } from '../utils/utils';

import { useTableState } from './ap-table-state-provider';
import { ImportTableDialog } from './import-table-dialog';

interface ApTableHeaderProps {
  onBack: () => void;
  lockedBy: { userId: string; userDisplayName: string } | null;
  takeOver: () => void;
}

export function ApTableHeader(props: ApTableHeaderProps) {
  const [
    selectedRecords,
    setSelectedRecords,
    isSaving,
    records,
    table,
    renameTable,
    deleteRecords,
  ] = useTableState((state) => [
    state.selectedRecords,
    state.setSelectedRecords,
    state.isSaving,
    state.records,
    state.table,
    state.renameTable,
    state.deleteRecords,
  ]);
  const [isImportTableDialogOpen, setIsImportTableDialogOpen] =
    createSignal(false);
  const [isEditingTableName, setIsEditingTableName] = createSignal(false);
  const { project } = projectCollectionUtils.useCurrentProject();
  const lockedByOtherUser = useTableState((state) => state.lockedByOtherUser);
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const canEdit = userHasTableWritePermission && !lockedByOtherUser;
  const userHasPermissionToPushToGit = useAuthorization().checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );
  const showPushToGit = gitSyncHooks.useShowPushToGit();

  const exportTemplate = async () => {
    const tableTemplate = await tablesApi.getTemplate(table.id);
    void downloadFile({
      obj: JSON.stringify(tableTemplate, null, 2),
      fileName: tableTemplate.name,
      extension: 'json',
    });
  };

  const downloadCsv = async () => {
    const exportedTable = await tablesApi.export(table.id);
    tablesUtils.exportTables([exportedTable]);
  };

  const titleContent = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={props.onBack} class="cursor-pointer">
            <Show when={project} keyed>
              {(item) => getProjectName(item)}
            </Show>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            <div class="flex items-center gap-1">
              <EditableText
                class="hover:cursor-text"
                value={table.name || t('Table Editor')}
                readonly={!canEdit}
                onValueChange={(newName) => {
                  renameTable(newName);
                }}
                isEditing={isEditingTableName}
                setIsEditing={setIsEditingTableName}
                tooltipContent={canEdit ? t('Edit Table Name') : ''}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    class="size-6 flex items-center justify-center"
                  >
                    <ChevronDown class="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-48">
                  <DropdownMenuItem
                    onSelect={() => {
                      setTimeout(() => setIsEditingTableName(true), 300);
                    }}
                    disabled={!canEdit}
                  >
                    <Edit2 class="mr-2 h-4 w-4" />
                    {t('Rename')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setIsImportTableDialogOpen(true)}
                    disabled={!canEdit}
                  >
                    <Import class="mr-2 h-4 w-4" />
                    {t('Import')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={exportTemplate}>
                    <FileJson class="mr-2 h-4 w-4" />
                    {t('Export Template')}
                  </DropdownMenuItem>
                  <Show when={showPushToGit}>
                    <>
                      <DropdownMenuSeparator />
                      <PermissionNeededTooltip
                        hasPermission={userHasPermissionToPushToGit}
                      >
                        <PushToGitDialog type="table" tables={[table]}>
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
                  <DropdownMenuItem onSelect={downloadCsv}>
                    <Download class="mr-2 h-4 w-4" />
                    {t('Download Data')}
                  </DropdownMenuItem>
                  <PermissionNeededTooltip hasPermission={canEdit}>
                    <ConfirmationDeleteDialog
                      title={t('Delete Table')}
                      message={String(
                        t(
                          'This will permanently delete the table and all its data.',
                        ),
                      )}
                      entityName={t('table')}
                      buttonText={t('Delete')}
                      mutationFn={() => {
                        void tablesApi.delete(table.id);
                        props.onBack();
                      }}
                    >
                      <DropdownMenuItem
                        disabled={!canEdit}
                        onSelect={(e: Event) => {
                          e.preventDefault();
                        }}
                        onClick={(e: Event) => {
                          e.stopPropagation();
                        }}
                        class="text-destructive focus:text-destructive"
                      >
                        <Trash2 class="mr-2 h-4 w-4" />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </ConfirmationDeleteDialog>
                  </PermissionNeededTooltip>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  const rightContent = (
    <div class="flex items-center gap-2">
      <Show when={isSaving}>
        <div class="flex items-center gap-2 text-muted-foreground animate-in fade-in">
          <RefreshCw class="h-4 w-4 animate-spin" />
          <span class="text-sm">{t('Saving...')}</span>
        </div>
      </Show>
      <Show when={props.lockedBy}>
        <div class="flex items-center gap-1.5 border border-warning/50 rounded-md px-2.5 py-1 text-sm text-warning-700 dark:text-warning-300">
          <Lock class="size-3.5 shrink-0" />
          <span>
            {t('{name} is editing', { name: props.lockedBy.userDisplayName })}
          </span>
          <span class="text-warning/40">|</span>
          <button class="hover:underline font-medium" onClick={props.takeOver}>
            {t('Take Over')}
          </button>
        </div>
      </Show>
      <ActiveUsersWidget resourceId={table.id} />
      <Show when={selectedRecords.size > 0}>
        <PermissionNeededTooltip hasPermission={canEdit}>
          <ConfirmationDeleteDialog
            title={t('Delete Records')}
            message={String(
              t('The selected records will be permanently deleted.'),
            )}
            entityName={selectedRecords.size === 1 ? t('record') : t('records')}
            buttonText={t('Delete')}
            mutationFn={() => {
              const indices = Array.from(selectedRecords).map((row) =>
                records.findIndex((r) => r.uuid === row),
              );
              deleteRecords(indices.map((index) => index.toString()));
              setSelectedRecords(new Set());
            }}
          >
            <Button
              variant="destructive"
              class="flex gap-2 items-center"
              disabled={!canEdit}
            >
              <Trash2 class="size-4" />
              {t('Delete Records')}{' '}
              {selectedRecords.size > 0 ? `(${selectedRecords.size})` : ''}
            </Button>
          </ConfirmationDeleteDialog>
        </PermissionNeededTooltip>
      </Show>
    </div>
  );

  return (
    <>
      <PageHeader
        title={titleContent}
        rightContent={rightContent}
        class="gap-1 justify-between px-4"
      />
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          class="flex gap-2 items-center"
          onClick={() => {
            void downloadCsv();
          }}
        >
          <Download class="size-4" />
          {t('Download Data')}
        </Button>
        <ImportTableDialog
          open={isImportTableDialogOpen}
          setIsOpen={setIsImportTableDialogOpen}
          tableId={table.id}
          allowedFileTypes={['json', 'csv']}
          onImportSuccess={() => window.location.reload()}
        />
      </div>
    </>
  );
}
