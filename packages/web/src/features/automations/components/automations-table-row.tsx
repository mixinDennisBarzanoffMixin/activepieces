import { createSignal } from 'solid-js';
import { FolderDto, PopulatedFlow, Table } from '@activepieces/shared';
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
  projectMembers: any;
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

export const AutomationsTableRow = ({
  item,
  isSelected,
  isExpanded,
  isPinned,
  isFolderLoading,
  folders,
  onToggleSelection,
  onTogglePin,
  onRename,
  onDelete,
  onDuplicate,
  onMoveTo,
  onExportFlow,
  onExportTable,
  onCreateInFolder,
  userHasPermissionToWriteFlow = true,
  userHasPermissionToWriteTable = true,
  isCreatingFlow,
  isCreatingTable,
  isMoving,
  isDuplicating,
  onLoadMore,
}: AutomationsTableRowProps) => {
  const { embedState } = useEmbedding();
  const [isMoveOpen, setIsMoveOpen] = createSignal(false);
  const [moveFolderId, setMoveFolderId] = createSignal('');
  const [isCreateTooltipOpen, setIsCreateTooltipOpen] = createSignal(false);

  if (item.type === 'load-more-folder') {
    return (
      <div class="flex-1 flex items-center justify-center gap-2 text-primary font-medium py-2">
        <div
          class="flex items-center gap-2 cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onLoadMore?.();
          }}
        >
          <ArrowDown class="h-4 w-4" />
          <span>
            {t('Load {count} more items...', { count: item.loadMoreCount })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        class="w-10 shrink-0 pl-4 pr-1 flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} />
      </div>
      <div
        class={cn(
          'w-8 shrink-0 flex items-center justify-center mr-2',
          item.type === 'folder' && 'mr-3',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {item.depth === 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onTogglePin}
                class="p-0.5 rounded hover:bg-muted transition-colors"
              >
                <Star
                  class={cn(
                    'h-4 w-4',
                    isPinned
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-muted-foreground/40 hover:text-muted-foreground',
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isPinned ? t('Remove from favorites') : t('Add to favorites')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div class="flex-1 min-w-[200px] pl-2 pr-2 flex items-center">
        <div
          class="relative flex items-center gap-2 min-w-0"
          style={{ paddingLeft: item.depth * 24 }}
        >
          {item.type === 'folder' && (
            <span class="absolute -left-5 flex items-center justify-center w-5">
              {isFolderLoading ? (
                <Loader2 class="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />
              ) : isExpanded ? (
                <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </span>
          )}
          <span class="shrink-0">
            <RowItemIcon item={item} />
          </span>
          <TextWithTooltip tooltipMessage={item.name}>
            <span>{item.name}</span>
          </TextWithTooltip>
        </div>
      </div>
      <div class="w-[230px] shrink-0 px-2 flex items-center">
        <RowItemDetails item={item} />
      </div>
      <div class="w-[200px] shrink-0 px-2 flex items-center">
        {item.data && (
          <FormattedDate
            date={new Date(item.data.updated)}
            class="text-left"
          />
        )}
      </div>
      {!embedState.isEmbedded && (
        <div class="w-[250px] shrink-0 px-2 flex items-center overflow-hidden">
          <RowItemOwner item={item} />
        </div>
      )}
      <div
        class="w-[120px] shrink-0 px-2 flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'flow' && (
          <FlowStatusToggle flow={item.data as PopulatedFlow} />
        )}
      </div>
      <div
        class="w-[80px] shrink-0 px-2 flex items-center justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'folder' && onCreateInFolder && (
          <Tooltip
            open={isCreateTooltipOpen}
            onOpenChange={setIsCreateTooltipOpen}
          >
            <CreateNewMenu
              scope="folder"
              align="end"
              userHasPermissionToWriteFlow={userHasPermissionToWriteFlow}
              userHasPermissionToWriteTable={userHasPermissionToWriteTable}
              userHasPermissionToWriteFolder={false}
              isCreatingFlow={isCreatingFlow}
              isCreatingTable={isCreatingTable}
              onCreateFlow={() => onCreateInFolder(item.id, 'flow')}
              onCreateTable={() => onCreateInFolder(item.id, 'table')}
              onImportFlow={() => onCreateInFolder(item.id, 'import-flow')}
              onImportTable={() => onCreateInFolder(item.id, 'import-table')}
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
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" class="h-8 w-8">
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.type === 'folder' && (
              <DropdownMenuItem
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('folder', item.id);
                  navigator.clipboard.writeText(url.toString());
                  toast.success(t('URL copied to clipboard'));
                }}
              >
                <Link class="h-4 w-4 mr-2" />
                {t('Copy URL')}
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={onRename}>
              <Pencil class="h-4 w-4 mr-2" />
              {t('Rename')}
            </DropdownMenuItem>

            {item.type === 'flow' && !embedState.hideDuplicateFlow && (
              <DropdownMenuItem
                onClick={() => onDuplicate(item.data as PopulatedFlow)}
                disabled={isDuplicating}
              >
                {isDuplicating ? (
                  <LoadingSpinner class="mr-2" />
                ) : (
                  <Copy class="h-4 w-4 mr-2" />
                )}
                {isDuplicating ? t('Duplicating...') : t('Duplicate')}
              </DropdownMenuItem>
            )}

            {(item.type === 'flow' || item.type === 'table') &&
              !embedState.hideFolders && (
                <DropdownMenuItem
                  onClick={() => {
                    setMoveFolderId('');
                    setIsMoveOpen(true);
                  }}
                >
                  <CornerUpLeft class="h-4 w-4 mr-2" />
                  {t('Move To')}
                </DropdownMenuItem>
              )}

            {item.type === 'flow' && !embedState.hideExportAndImportFlow && (
              <DropdownMenuItem
                onClick={() => onExportFlow(item.data as PopulatedFlow)}
              >
                <Download class="h-4 w-4 mr-2" />
                {t('Export')}
              </DropdownMenuItem>
            )}

            {item.type === 'table' && (
              <DropdownMenuItem
                onClick={() => onExportTable(item.data as Table)}
              >
                <Download class="h-4 w-4 mr-2" />
                {t('Export')}
              </DropdownMenuItem>
            )}

            {item.type === 'flow' && !embedState.isEmbedded && (
              <ShareTemplateDialog
                flowId={item.id}
                flowVersionId={(item.data as PopulatedFlow).version.id}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Share2 class="h-4 w-4 mr-2" />
                  {t('Share')}
                </DropdownMenuItem>
              </ShareTemplateDialog>
            )}

            <DropdownMenuSeparator />
            <ConfirmationDeleteDialog
              title={t('Delete {type}', { type: item.type })}
              message={t('Deleting "{name}" cannot be undone.', {
                name: item.name,
              })}
              mutationFn={async () => onDelete()}
              entityName={item.type}
              buttonText={t('Delete')}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
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
          folders={folders}
          selectedFolderId={moveFolderId}
          onFolderChange={setMoveFolderId}
          onConfirm={() => {
            onMoveTo(item, moveFolderId);
            setIsMoveOpen(false);
          }}
          isMoving={isMoving}
        />
      </div>
    </>
  );
};

const RowItemIcon = ({ item }: { item: TreeItem }) => {
  switch (item.type) {
    case 'folder':
      return <Folder class="h-4 w-4 text-gray-400 fill-gray-400" />;
    case 'flow':
      return <Workflow class="h-4 w-4 text-primary" />;
    default:
      return <Table2 class="h-4 w-4 text-emerald-500" />;
  }
};

const RowItemDetails = ({ item }: { item: TreeItem }) => {
  switch (item.type) {
    case 'folder':
      return (
        <span class="text-muted-foreground">
          {item.childCount} {item.childCount === 1 ? t('file') : t('files')}
        </span>
      );
    case 'flow': {
      const flow = item.data as PopulatedFlow;
      return (
        <PieceIconList
          trigger={flow.version.trigger}
          maxNumberOfIconsToShow={3}
          size="xs"
        />
      );
    }
    default:
      return <span class="text-muted-foreground">-</span>;
  }
};

const RowItemOwner = ({ item }: { item: TreeItem }) => {
  if (item.type === 'flow') {
    const flow = item.data as PopulatedFlow;
    if (flow.ownerId) {
      return (
        <ApAvatar
          id={flow.ownerId}
          includeAvatar={true}
          includeName={true}
          size="small"
        />
      );
    }
  }
  return <span class="text-muted-foreground">-</span>;
};
