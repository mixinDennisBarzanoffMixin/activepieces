import {
  FolderDto,
  PopulatedFlow,
  ProjectMemberWithUser,
  Table,
} from '@activepieces/shared';
import { Accordion } from '@kobalte/core/accordion';
import { t } from 'i18next';
import { Activity, Clock, Info, Type, User } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { SelectedItemsMap, TreeItem } from '../lib/types';
import { groupTreeItemsByFolder } from '../lib/utils';

import { AutomationsTableRow } from './automations-table-row';
import { CreateInFolderKind } from './create-new-menu';

type AutomationsTableProps = {
  items: TreeItem[];
  isLoading: boolean;
  selectedItems: SelectedItemsMap;
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  projectMembers: ProjectMemberWithUser[] | undefined;
  folders: FolderDto[];
  selectableCount: number;
  isPinned: (itemId: string) => boolean;
  onTogglePin: (itemId: string) => void;
  onToggleAllSelection: () => void;
  onToggleItemSelection: (item: TreeItem) => void;
  onRowClick: (item: TreeItem, ctrlKey?: boolean) => void;
  onRenameItem: (item: TreeItem) => void;
  onDeleteItem: (item: TreeItem) => void;
  onDuplicateFlow: (flow: PopulatedFlow) => void;
  onMoveItem: (item: TreeItem, folderId: string) => void;
  onExportFlow: (flow: PopulatedFlow) => void;
  onExportTable: (table: Table) => void;
  onCreateInFolder?: (folderId: string, kind: CreateInFolderKind) => void;
  userHasPermissionToWriteFlow?: boolean;
  userHasPermissionToWriteTable?: boolean;
  isCreatingFlow?: boolean;
  isCreatingTable?: boolean;
  isMoving: boolean;
  isDuplicating: boolean;
  onLoadMoreInFolder: (folderId: string) => void;
  isItemSelected: (item: TreeItem) => boolean;
};

const rowClassName =
  'group flex items-center min-h-[48px] py-2 text-sm cursor-pointer hover:bg-muted/50';

export const AutomationsTable = (props: AutomationsTableProps) => {
  const { embedState } = useEmbedding();
  const groups = createMemo(() => groupTreeItemsByFolder(props.items));

  return (
    <div class="overflow-x-auto">
      <div class="min-w-[1000px]">
        <div class="flex items-center h-8 text-xs border-b font-medium text-foreground bg-muted/50">
          <div class="w-10 shrink-0 pl-4 pr-1">
            <Checkbox
              checked={
                props.selectableCount > 0 &&
                props.selectedItems.size === props.selectableCount
              }
              onCheckedChange={props.onToggleAllSelection}
            />
          </div>
          <div class="w-8 shrink-0" />
          <div class="flex-1 min-w-[200px] pl-2 flex items-center gap-1.5">
            <Type class="h-3.5 w-3.5" />
            {t('Name')}
          </div>

          <div class="w-[230px] shrink-0 px-2 flex items-center gap-1.5">
            <Info class="h-3.5 w-3.5" />
            {t('Details')}
          </div>

          <div class="w-[200px] shrink-0 px-2 flex items-center gap-1.5">
            <Clock class="h-3.5 w-3.5" />
            {t('Last modified')}
          </div>
          <Show when={!embedState.isEmbedded}>
            <div class="w-[250px] shrink-0 px-2 flex items-center gap-1.5">
              <User class="h-3.5 w-3.5" />
              {t('Owner')}
            </div>
          </Show>
          <div class="w-[120px] shrink-0 px-2 flex items-center gap-1.5">
            <Activity class="h-3.5 w-3.5" />
            {t('Status')}
          </div>
          <div class="w-[80px] shrink-0 px-2" />
        </div>

        <Show
          when={props.isLoading}
          fallback={
            <Accordion multiple value={Array.from(props.expandedFolders)}>
              <For each={groups()}>
                {(group) => {
                  const isFolder = group.item.type === 'folder';

                  if (isFolder) {
                    return (
                      <Accordion.Item
                        key={`folder-${group.item.id}`}
                        value={group.item.id}
                        class="border-b"
                      >
                        <div
                          class={cn(rowClassName)}
                          onClick={(e) =>
                            props.onRowClick(group.item, e.ctrlKey || e.metaKey)
                          }
                        >
                          <AutomationsTableRow
                            item={group.item}
                            isSelected={props.isItemSelected(group.item)}
                            isExpanded={props.expandedFolders.has(
                              group.item.id,
                            )}
                            isPinned={props.isPinned(group.item.id)}
                            isFolderLoading={props.loadingFolders.has(
                              group.item.id,
                            )}
                            projectMembers={props.projectMembers}
                            folders={props.folders}
                            onRowClick={() => props.onRowClick(group.item)}
                            onToggleSelection={() =>
                              props.onToggleItemSelection(group.item)
                            }
                            onTogglePin={() => props.onTogglePin(group.item.id)}
                            onRename={() => props.onRenameItem(group.item)}
                            onDelete={() => props.onDeleteItem(group.item)}
                            onDuplicate={props.onDuplicateFlow}
                            onMoveTo={props.onMoveItem}
                            onExportFlow={props.onExportFlow}
                            onExportTable={props.onExportTable}
                            onCreateInFolder={props.onCreateInFolder}
                            userHasPermissionToWriteFlow={
                              props.userHasPermissionToWriteFlow
                            }
                            userHasPermissionToWriteTable={
                              props.userHasPermissionToWriteTable
                            }
                            isCreatingFlow={props.isCreatingFlow}
                            isCreatingTable={props.isCreatingTable}
                            isMoving={props.isMoving}
                            isDuplicating={props.isDuplicating}
                            onLoadMore={undefined}
                          />
                        </div>
                        <Accordion.Content class="overflow-hidden data-[closed]:animate-accordion-up data-[expanded]:animate-accordion-down">
                          <For each={group.children}>
                            {(child) => (
                              <div
                                class={cn(rowClassName, 'border-t')}
                                onClick={(e) =>
                                  props.onRowClick(
                                    child,
                                    e.ctrlKey || e.metaKey,
                                  )
                                }
                              >
                                <AutomationsTableRow
                                  item={child}
                                  isSelected={props.isItemSelected(child)}
                                  isExpanded={false}
                                  isPinned={props.isPinned(child.id)}
                                  projectMembers={props.projectMembers}
                                  folders={props.folders}
                                  onRowClick={() => props.onRowClick(child)}
                                  onToggleSelection={() =>
                                    props.onToggleItemSelection(child)
                                  }
                                  onTogglePin={() =>
                                    props.onTogglePin(child.id)
                                  }
                                  onRename={() => props.onRenameItem(child)}
                                  onDelete={() => props.onDeleteItem(child)}
                                  onDuplicate={props.onDuplicateFlow}
                                  onMoveTo={props.onMoveItem}
                                  onExportFlow={props.onExportFlow}
                                  onExportTable={props.onExportTable}
                                  isMoving={props.isMoving}
                                  isDuplicating={props.isDuplicating}
                                  onLoadMore={
                                    child.type === 'load-more-folder'
                                      ? () =>
                                          props.onLoadMoreInFolder(
                                            child.folderId,
                                          )
                                      : undefined
                                  }
                                />
                              </div>
                            )}
                          </For>
                        </Accordion.Content>
                      </Accordion.Item>
                    );
                  }

                  return (
                    <div
                      class={cn(rowClassName, 'border-b')}
                      onClick={(e) =>
                        props.onRowClick(group.item, e.ctrlKey || e.metaKey)
                      }
                    >
                      <AutomationsTableRow
                        item={group.item}
                        isSelected={props.isItemSelected(group.item)}
                        isExpanded={false}
                        isPinned={props.isPinned(group.item.id)}
                        projectMembers={props.projectMembers}
                        folders={props.folders}
                        onRowClick={() => props.onRowClick(group.item)}
                        onToggleSelection={() =>
                          props.onToggleItemSelection(group.item)
                        }
                        onTogglePin={() => props.onTogglePin(group.item.id)}
                        onRename={() => props.onRenameItem(group.item)}
                        onDelete={() => props.onDeleteItem(group.item)}
                        onDuplicate={props.onDuplicateFlow}
                        onMoveTo={props.onMoveItem}
                        onExportFlow={props.onExportFlow}
                        onExportTable={props.onExportTable}
                        isMoving={props.isMoving}
                        isDuplicating={props.isDuplicating}
                        onLoadMore={undefined}
                      />
                    </div>
                  );
                }}
              </For>
            </Accordion>
          }
        >
          <div class="p-2">
            <For each={Array.from({ length: 10 })}>
              {() => (
                <div class="w-full h-9 mb-3 rounded-sm">
                  <Skeleton class="w-full min-h-9" />
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};
