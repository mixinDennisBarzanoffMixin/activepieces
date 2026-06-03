import {
  FolderDto,
  PopulatedFlow,
  ProjectMemberWithUser,
  Table,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Copy,
  CornerUpLeft,
  Download,
  Folder,
  Link,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Star,
  Table2,
  Trash2,
  Workflow,
} from 'lucide-solid';
import { createSignal, mergeProps, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { FormattedDate } from '@/components/custom/formatted-date';
import { LoadingSpinner } from '@/components/custom/spinner';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoveToFolderDialog } from '@/features/automations/components/move-to-folder-dialog';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { ShareTemplateDialog } from '@/features/flows/components/share-template-dialog';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { cn } from '@/lib/utils';

import { TreeItem } from '../lib/types';

import { CreateNewMenu, CreateInFolderKind } from './create-new-menu';

type AutomationsTableRowProps = {
  item: TreeItem;
  isSelected: boolean;
  isExpanded: boolean;
  isPinned: boolean;
  isFolderLoading?: boolean;
  projectMembers?: ProjectMemberWithUser[];
  folders: FolderDto[];
  onRowClick: () => void;
  onToggleSelection: () => void;
  onTogglePin: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: (flow: PopulatedFlow) => void;
  onMoveTo: (item: TreeItem, folderId: string) => void;
  onExportFlow: (flow: PopulatedFlow) => void;
  onExportTable: (table: Table) => void;
  onCreateInFolder?: (folderId: string, kind: CreateInFolderKind) => void;
  userHasPermissionToWriteFlow?: boolean;
  userHasPermissionToWriteTable?: boolean;
  isCreatingFlow?: boolean;
  isCreatingTable?: boolean;
  isMoving: boolean;
  isDuplicating: boolean;
  onLoadMore?: () => void;
};

export const AutomationsTableRow = (_props: AutomationsTableRowProps) => {
  const props = mergeProps(
    { userHasPermissionToWriteFlow: true, userHasPermissionToWriteTable: true },
    _props,
  );
  const { embedState } = useEmbedding();
  const [isMoveOpen, setIsMoveOpen] = createSignal(false);
  const [moveFolderId, setMoveFolderId] = createSignal('');
  const [isCreateTooltipOpen, setIsCreateTooltipOpen] = createSignal(false);

  return (
    <>
      <Show
        when={props.item.type === 'load-more-folder'}
        fallback={
          <>
            <div
              class="w-10 shrink-0 pl-4 pr-1 flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={props.isSelected}
                onCheckedChange={props.onToggleSelection}
              />
            </div>
            <div
              class={cn(
                'w-8 shrink-0 flex items-center justify-center mr-2',
                props.item.type === 'folder' && 'mr-3',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Show when={props.item.depth === 0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={props.onTogglePin}
                      class="p-0.5 rounded hover:bg-muted transition-colors"
                    >
                      <Star
                        class={cn(
                          'h-4 w-4',
                          props.isPinned
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-muted-foreground/40 hover:text-muted-foreground',
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {props.isPinned
                      ? t('Remove from favorites')
                      : t('Add to favorites')}
                  </TooltipContent>
                </Tooltip>
              </Show>
            </div>
            <div class="flex-1 min-w-[200px] pl-2 pr-2 flex items-center">
              <div
                class="relative flex items-center gap-2 min-w-0"
                style={{ 'padding-left': props.item.depth * 24 }}
              >
                <Show when={props.item.type === 'folder'}>
                  <span class="absolute -left-5 flex items-center justify-center w-5">
                    <Show
                      when={props.isFolderLoading}
                      fallback={
                        props.isExpanded ? (
                          <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground" />
                        )
                      }
                    >
                      <Loader2 class="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />
                    </Show>
                  </span>
                </Show>
                <span class="shrink-0">{rowItemIcon(props.item)}</span>
                <TextWithTooltip tooltipMessage={props.item.name}>
                  <span>{props.item.name}</span>
                </TextWithTooltip>
              </div>
            </div>
            <div class="w-[230px] shrink-0 px-2 flex items-center">
              {rowItemDetails(props.item)}
            </div>
            <div class="w-[200px] shrink-0 px-2 flex items-center">
              <Show when={props.item.data}>
                <FormattedDate
                  date={new Date(props.item.data.updated)}
                  class="text-left"
                />
              </Show>
            </div>
            <Show when={!embedState.isEmbedded}>
              <div class="w-[250px] shrink-0 px-2 flex items-center overflow-hidden">
                {rowItemOwner(props.item)}
              </div>
            </Show>
            <div
              class="w-[120px] shrink-0 px-2 flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Show when={props.item.type === 'flow'}>
                <FlowStatusToggle flow={props.item.data} />
              </Show>
            </div>
            <div
              class="w-[80px] shrink-0 px-2 flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Show
                when={props.item.type === 'folder' && props.onCreateInFolder}
              >
                <Tooltip
                  open={isCreateTooltipOpen}
                  onOpenChange={setIsCreateTooltipOpen}
                >
                  <CreateNewMenu
                    scope="folder"
                    align="end"
                    userHasPermissionToWriteFlow={
                      props.userHasPermissionToWriteFlow
                    }
                    userHasPermissionToWriteTable={
                      props.userHasPermissionToWriteTable
                    }
                    userHasPermissionToWriteFolder={false}
                    isCreatingFlow={props.isCreatingFlow}
                    isCreatingTable={props.isCreatingTable}
                    onCreateFlow={() =>
                      props.onCreateInFolder(props.item.id, 'flow')
                    }
                    onCreateTable={() =>
                      props.onCreateInFolder(props.item.id, 'table')
                    }
                    onImportFlow={() =>
                      props.onCreateInFolder(props.item.id, 'import-flow')
                    }
                    onImportTable={() =>
                      props.onCreateInFolder(props.item.id, 'import-table')
                    }
                    onOpenChange={(open) => {
                      if (open) setIsCreateTooltipOpen(false);
                    }}
                  >
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                        aria-label={t('Create inside folder')}
                      >
                        <Plus class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                  </CreateNewMenu>
                  <TooltipContent side="top">
                    {t('Create inside folder')}
                  </TooltipContent>
                </Tooltip>
              </Show>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Show when={props.item.type === 'folder'}>
                    <DropdownMenuItem
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('folder', props.item.id);
                        void navigator.clipboard.writeText(url.toString());
                        toast.success(t('URL copied to clipboard'));
                      }}
                    >
                      <Link class="h-4 w-4 mr-2" />
                      {t('Copy URL')}
                    </DropdownMenuItem>
                  </Show>

                  <DropdownMenuItem onClick={props.onRename}>
                    <Pencil class="h-4 w-4 mr-2" />
                    {t('Rename')}
                  </DropdownMenuItem>

                  <Show
                    when={
                      props.item.type === 'flow' &&
                      !embedState.hideDuplicateFlow
                    }
                  >
                    <DropdownMenuItem
                      onClick={() => props.onDuplicate(props.item.data)}
                      disabled={props.isDuplicating}
                    >
                      <Show
                        when={props.isDuplicating}
                        fallback={<Copy class="h-4 w-4 mr-2" />}
                      >
                        <LoadingSpinner class="mr-2" />
                      </Show>
                      {props.isDuplicating
                        ? t('Duplicating...')
                        : t('Duplicate')}
                    </DropdownMenuItem>
                  </Show>

                  <Show
                    when={
                      (props.item.type === 'flow' ||
                        props.item.type === 'table') &&
                      !embedState.hideFolders
                    }
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        setMoveFolderId('');
                        setIsMoveOpen(true);
                      }}
                    >
                      <CornerUpLeft class="h-4 w-4 mr-2" />
                      {t('Move To')}
                    </DropdownMenuItem>
                  </Show>

                  <Show
                    when={
                      props.item.type === 'flow' &&
                      !embedState.hideExportAndImportFlow
                    }
                  >
                    <DropdownMenuItem
                      onClick={() => props.onExportFlow(props.item.data)}
                    >
                      <Download class="h-4 w-4 mr-2" />
                      {t('Export')}
                    </DropdownMenuItem>
                  </Show>

                  <Show when={props.item.type === 'table'}>
                    <DropdownMenuItem
                      onClick={() => props.onExportTable(props.item.data)}
                    >
                      <Download class="h-4 w-4 mr-2" />
                      {t('Export')}
                    </DropdownMenuItem>
                  </Show>

                  <Show
                    when={props.item.type === 'flow' && !embedState.isEmbedded}
                  >
                    <ShareTemplateDialog
                      flowId={props.item.id}
                      flowVersionId={props.item.data.version.id}
                    >
                      <DropdownMenuItem
                        onSelect={(e: Event) => e.preventDefault()}
                      >
                        <Share2 class="h-4 w-4 mr-2" />
                        {t('Share')}
                      </DropdownMenuItem>
                    </ShareTemplateDialog>
                  </Show>

                  <DropdownMenuSeparator />
                  <ConfirmationDeleteDialog
                    title={t('Delete {type}', { type: props.item.type })}
                    message={String(
                      t('Deleting "{name}" cannot be undone.', {
                        name: props.item.name,
                      }),
                    )}
                    mutationFn={() => Promise.resolve(props.onDelete())}
                    entityName={props.item.type}
                    buttonText={t('Delete')}
                  >
                    <DropdownMenuItem
                      onSelect={(e: Event) => e.preventDefault()}
                      class="text-destructive focus:text-destructive"
                    >
                      <Trash2 class="h-4 w-4 mr-2" />
                      {t('Delete')}
                    </DropdownMenuItem>
                  </ConfirmationDeleteDialog>
                </DropdownMenuContent>
              </DropdownMenu>

              <MoveToFolderDialog
                open={isMoveOpen}
                onOpenChange={setIsMoveOpen}
                folders={props.folders}
                selectedFolderId={moveFolderId}
                onFolderChange={setMoveFolderId}
                onConfirm={() => {
                  props.onMoveTo(props.item, moveFolderId);
                  setIsMoveOpen(false);
                }}
                isMoving={props.isMoving}
              />
            </div>
          </>
        }
      >
        <div class="flex-1 flex items-center justify-center gap-2 text-primary font-medium py-2">
          <div
            class="flex items-center gap-2 cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              props.onLoadMore?.();
            }}
          >
            <ArrowDown class="h-4 w-4" />
            <span>
              {t('Load {count} more items...', {
                count: props.item.loadMoreCount,
              })}
            </span>
          </div>
        </div>
      </Show>
    </>
  );
};

function rowItemIcon(item: TreeItem) {
  switch (item.type) {
    case 'folder':
      return <Folder class="h-4 w-4 text-gray-400 fill-gray-400" />;
    case 'flow':
      return <Workflow class="h-4 w-4 text-primary" />;
    default:
      return <Table2 class="h-4 w-4 text-emerald-500" />;
  }
}

function rowItemDetails(item: TreeItem) {
  switch (item.type) {
    case 'folder':
      return (
        <span class="text-muted-foreground">
          {item.childCount} {item.childCount === 1 ? t('file') : t('files')}
        </span>
      );
    case 'flow': {
      return (
        <PieceIconList
          trigger={item.data.version.trigger}
          maxNumberOfIconsToShow={3}
          size="xs"
        />
      );
    }
    default:
      return <span class="text-muted-foreground">-</span>;
  }
}

function rowItemOwner(item: TreeItem) {
  if (item.type === 'flow') {
    if (item.data.ownerId) {
      return (
        <ApAvatar
          id={item.data.ownerId}
          includeAvatar={true}
          includeName={true}
          size="small"
        />
      );
    }
  }
  return <span class="text-muted-foreground">-</span>;
}
