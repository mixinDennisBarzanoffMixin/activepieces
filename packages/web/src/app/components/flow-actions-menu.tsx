import {
  FlowOperationType,
  FlowVersion,
  FlowVersionState,
  GitBranchType,
  Permission,
  PopulatedFlow,
} from '@activepieces/shared';
import { useLocation } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import {
  Copy,
  CornerUpLeft,
  Download,
  GalleryVerticalEnd,
  Import,
  Pencil,
  Share2,
  Trash2,
  UploadCloud,
  User,
} from 'lucide-solid';
import { Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { LoadingSpinner } from '@/components/custom/spinner';
import { useEmbedding } from '@/components/providers/embed-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoveToFolderDialog } from '@/features/automations/components/move-to-folder-dialog';
import { RenameDialog } from '@/features/automations/components/rename-dialog';
import { flowHooks, flowsApi } from '@/features/flows';
import { ChangeOwnerDialog } from '@/features/flows/components/change-owner-dialog';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { foldersHooks } from '@/features/folders';
import { projectMembersHooks } from '@/features/members';
import { gitSyncHooks } from '@/features/project-releases';
import { PublishedNeededTooltip } from '@/features/project-releases/components/published-tooltip';
import { PushToGitDialog } from '@/features/project-releases/components/push-to-git-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';

import { ShareTemplateDialog } from '../../features/flows/components/share-template-dialog';

type FlowActionMenuProps = {
  flow: PopulatedFlow;
  flowVersion: FlowVersion;
  children?: JSX.Element;
  readonly: boolean;
  onRename: () => void;
  onMoveTo: (folderId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOwnerChange?: () => void;
} & (
  | { insideBuilder: true; onVersionsListClick: () => void }
  | { insideBuilder: false; onVersionsListClick: null }
);

const FlowActionMenu = ({
  flow,
  flowVersion,
  children,
  readonly,
  onRename,
  onMoveTo,
  onDuplicate,
  onDelete,
  onOwnerChange,
  onVersionsListClick,
  insideBuilder,
}) => {
  const isRunsPage = useLocation().pathname.includes('/runs');
  const { platform } = platformHooks.useCurrentPlatform();
  const openNewWindow = useNewWindow();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.plan.environmentsEnabled,
  );
  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteFolder = checkAccess(Permission.WRITE_FOLDER);
  const userHasPermissionToUpdateFlow = checkAccess(Permission.WRITE_FLOW);
  const userHasPermissionToPushToGit = checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );

  const { embedState } = useEmbedding();
  const isDevelopmentBranch =
    gitSync && gitSync.branchType === GitBranchType.DEVELOPMENT;
  const [open, setOpen] = createSignal(false);
  const allowPush =
    flow.publishedVersionId !== null &&
    flow.version.state === FlowVersionState.LOCKED;
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const hasProjectMembers = projectMembers && projectMembers.length > 0;

  const [isRenameOpen, setIsRenameOpen] = createSignal(false);
  const [renameValue, setRenameValue] = createSignal(flowVersion.displayName);
  const [isMoveOpen, setIsMoveOpen] = createSignal(false);
  const [folderToMoveId, setFolderToMoveId] = createSignal('');
  const { folders } = foldersHooks.useFolders();

  const { mutate: renameFlow, isPending: isRenamePending } = createMutation(
    () => ({
      mutationFn: async () =>
        flowsApi.update(flow.id, {
          type: FlowOperationType.CHANGE_NAME,
          request: { displayName: renameValue },
        }),
      onSuccess: () => {
        setIsRenameOpen(false);
        onRename();
        toast.success(t('Flow has been renamed.'));
      },
    }),
  );

  const { mutate: moveFlow, isPending: isMovePending } = createMutation(() => ({
    mutationFn: async () =>
      flowsApi.update(flow.id, {
        type: FlowOperationType.CHANGE_FOLDER,
        request: { folderId: folderToMoveId },
      }),
    onSuccess: () => {
      setIsMoveOpen(false);
      onMoveTo(folderToMoveId);
      toast.success(t('Moved flow successfully'));
    },
  }));

  const { mutate: duplicateFlow, isPending: isDuplicatePending } =
    createMutation(() => ({
      mutationFn: async () => {
        const modifiedFlowVersion = {
          ...flowVersion,
          displayName: `${flowVersion.displayName} - Copy`,
        };
        const createdFlow = await flowsApi.create({
          displayName: modifiedFlowVersion.displayName,
          projectId: authenticationSession.getProjectId()!,
          folderId: flow.folderId ?? undefined,
        });
        const updatedFlow = await flowsApi.update(createdFlow.id, {
          type: FlowOperationType.IMPORT_FLOW,
          request: {
            displayName: modifiedFlowVersion.displayName,
            trigger: modifiedFlowVersion.trigger,
            schemaVersion: modifiedFlowVersion.schemaVersion,
            notes: modifiedFlowVersion.notes,
          },
        });
        return updatedFlow;
      },
      onSuccess: (data) => {
        openNewWindow(`/flows/${data.id}`);
        onDuplicate();
      },
    }));

  const { mutate: exportFlow, isPending: isExportPending } =
    flowHooks.useExportFlows();
  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          noAnimationOnOut={true}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {
            <Show when={!readonly}>
              <>
                {
                  <Show when={insideBuilder}>
                    <PermissionNeededTooltip
                      hasPermission={userHasPermissionToUpdateFlow}
                    >
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpen(false);
                          onRename();
                        }}
                        disabled={!userHasPermissionToUpdateFlow}
                      >
                        <div className="flex cursor-pointer flex-row gap-2 items-center">
                          <Pencil class="h-4 w-4" />
                          <span>{t('Rename')}</span>
                        </div>
                      </DropdownMenuItem>
                    </PermissionNeededTooltip>
                  </Show>
                }

                {
                  <Show when={!insideBuilder}>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(false);
                        setRenameValue(flowVersion.displayName);
                        setIsRenameOpen(true);
                      }}
                      disabled={!userHasPermissionToUpdateFlow}
                    >
                      <div className="flex cursor-pointer flex-row gap-2 items-center">
                        <Pencil class="h-4 w-4" />
                        <span>{t('Rename')}</span>
                      </div>
                    </DropdownMenuItem>
                  </Show>
                }
              </>
            </Show>
          }

          <PermissionNeededTooltip hasPermission={userHasPermissionToPushToGit}>
            <PublishedNeededTooltip allowPush={allowPush}>
              <PushToGitDialog type="flow" flows={[flow]}>
                <DropdownMenuItem
                  disabled={!userHasPermissionToPushToGit || !allowPush}
                  onSelect={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex cursor-pointer  flex-row gap-2 items-center">
                    <UploadCloud class="h-4 w-4" />
                    <span>{t('Push to Git')}</span>
                  </div>
                </DropdownMenuItem>
              </PushToGitDialog>
            </PublishedNeededTooltip>
          </PermissionNeededTooltip>

          {
            <Show when={!embedState.hideFolders}>
              <PermissionNeededTooltip
                hasPermission={
                  userHasPermissionToUpdateFlow ||
                  userHasPermissionToWriteFolder
                }
              >
                <DropdownMenuItem
                  disabled={
                    !userHasPermissionToUpdateFlow ||
                    !userHasPermissionToWriteFolder
                  }
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(false);
                    setIsMoveOpen(true);
                  }}
                >
                  <div className="flex cursor-pointer  flex-row gap-2 items-center">
                    <CornerUpLeft class="h-4 w-4" />
                    <span>{t('Move To')}</span>
                  </div>
                </DropdownMenuItem>
              </PermissionNeededTooltip>
            </Show>
          }
          {
            <Show
              when={!readonly && hasProjectMembers && !embedState.isEmbedded}
            >
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToUpdateFlow}
              >
                <ChangeOwnerDialog
                  flow={flow}
                  onOwnerChange={onOwnerChange || (() => {})}
                >
                  <DropdownMenuItem
                    disabled={!userHasPermissionToUpdateFlow}
                    onSelect={(e) => e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex cursor-pointer  flex-row gap-2 items-center">
                      <User class="h-4 w-4" />
                      <span>{t('Change Owner')}</span>
                    </div>
                  </DropdownMenuItem>
                </ChangeOwnerDialog>
              </PermissionNeededTooltip>
            </Show>
          }
          {
            <Show when={!embedState.hideDuplicateFlow}>
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToUpdateFlow}
              >
                <DropdownMenuItem
                  disabled={!userHasPermissionToUpdateFlow}
                  onClick={() => duplicateFlow()}
                >
                  <div className="flex cursor-pointer  flex-row gap-2 items-center">
                    {
                      <Show
                        when={isDuplicatePending}
                        fallback={<Copy class="h-4 w-4" />}
                      >
                        <LoadingSpinner />
                      </Show>
                    }
                    <span>
                      {isDuplicatePending ? t('Duplicating') : t('Duplicate')}
                    </span>
                  </div>
                </DropdownMenuItem>
              </PermissionNeededTooltip>
            </Show>
          }

          {
            <Show when={insideBuilder && !isRunsPage}>
              <DropdownMenuItem onClick={onVersionsListClick}>
                <div className="flex cursor-pointer  flex-row gap-2 items-center">
                  <GalleryVerticalEnd class="h-4 w-4" />
                  <span>{t('Versions')}</span>
                </div>
              </DropdownMenuItem>
            </Show>
          }
          {
            <Show
              when={
                !readonly &&
                insideBuilder &&
                !embedState.hideExportAndImportFlow
              }
            >
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToUpdateFlow}
              >
                <ImportFlowDialog insideBuilder={true} flowId={flow.id}>
                  <DropdownMenuItem
                    disabled={!userHasPermissionToUpdateFlow}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex cursor-pointer flex-row gap-2 items-center">
                      <Import class="w-4 h-4" />
                      {t('Import')}
                    </div>
                  </DropdownMenuItem>
                </ImportFlowDialog>
              </PermissionNeededTooltip>
            </Show>
          }

          {
            <Show when={!embedState.hideExportAndImportFlow}>
              <DropdownMenuItem onClick={() => exportFlow([flow])}>
                <div className="flex cursor-pointer  flex-row gap-2 items-center">
                  {
                    <Show
                      when={isExportPending}
                      fallback={<Download class="h-4 w-4" />}
                    >
                      <LoadingSpinner />
                    </Show>
                  }
                  <span>{isExportPending ? t('Exporting') : t('Export')}</span>
                </div>
              </DropdownMenuItem>
            </Show>
          }
          {
            <Show when={!embedState.isEmbedded}>
              <ShareTemplateDialog
                flowId={flow.id}
                flowVersionId={flowVersion.id}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <div className="flex cursor-pointer  flex-row gap-2 items-center">
                    <Share2 class="h-4 w-4" />
                    <span>{t('Share')}</span>
                  </div>
                </DropdownMenuItem>
              </ShareTemplateDialog>
            </Show>
          }
          {
            <Show
              when={
                !readonly &&
                (!embedState.isEmbedded ||
                  !embedState.disableNavigationInBuilder ||
                  !insideBuilder)
              }
            >
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToUpdateFlow}
              >
                <ConfirmationDeleteDialog
                  title={t('Delete Flow')}
                  message={
                    <>
                      <div>
                        {t(
                          'This will permanently delete the flow, all its data, and any background runs.',
                        )}
                      </div>
                      {
                        <Show when={isDevelopmentBranch}>
                          <div className="font-bold mt-2">
                            {t(
                              'You are on a development branch, this will also delete the flow from the remote repository.',
                            )}
                          </div>
                        </Show>
                      }
                    </>
                  }
                  mutationFn={async () => {
                    await flowsApi.delete(flow.id);
                    onDelete();
                  }}
                  entityName={t('flow')}
                  buttonText={t('Delete')}
                >
                  <DropdownMenuItem
                    disabled={!userHasPermissionToUpdateFlow}
                    onSelect={(e) => e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex cursor-pointer  flex-row gap-2 items-center">
                      <Trash2 class="h-4 w-4 text-destructive" />
                      <span className="text-destructive">{t('Delete')}</span>
                    </div>
                  </DropdownMenuItem>
                </ConfirmationDeleteDialog>
              </PermissionNeededTooltip>
            </Show>
          }
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        value={renameValue}
        onChange={setRenameValue}
        onConfirm={() => renameFlow()}
        isRenaming={isRenamePending}
      />
      <MoveToFolderDialog
        open={isMoveOpen}
        onOpenChange={setIsMoveOpen}
        folders={folders}
        selectedFolderId={folderToMoveId}
        onFolderChange={setFolderToMoveId}
        onConfirm={() => moveFlow()}
        isMoving={isMovePending}
      />
    </>
  );
};

export default FlowActionMenu;
