import { createSignal } from 'solid-js';

import { SelectedItemsMap, TreeItem } from '../lib/types';

import { useAutomationsMutations } from './use-automations-mutations';

type DialogsDeps = {
  mutations: ReturnType<typeof useAutomationsMutations>;
  selectedItems: SelectedItemsMap;
};

export function useAutomationsDialogs({
  mutations,
  selectedItems,
}: DialogsDeps) {
  const [isFolderDialogOpen, setIsFolderDialogOpen] = createSignal(false);
  const [isImportFlowDialogOpen, setIsImportFlowDialogOpen] = createSignal(false);
  const [isImportTableDialogOpen, setIsImportTableDialogOpen] = createSignal(false);
  const [importTargetFolderId, setImportTargetFolderId] = createSignal<
    string | undefined
  >(undefined);
  const [moveToDialogOpen, setMoveToDialogOpen] = createSignal(false);
  const [moveToFolderId, setMoveToFolderId] = createSignal<string>('');
  const [renameDialogOpen, setRenameDialogOpen] = createSignal(false);
  const [newName, setNewName] = createSignal('');
  const [itemToRename, setItemToRename] = createSignal<TreeItem | null>(null);

  const openRenameDialog = (item: TreeItem) => {
    setItemToRename(item);
    setNewName(item.name);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!itemToRename() || !newName().trim()) return;
    await mutations.handleRename(itemToRename()!, newName());
    setRenameDialogOpen(false);
    setItemToRename(null);
  };

  const handleBulkMoveTo = async () => {
    await mutations.handleBulkMoveTo(selectedItems, moveToFolderId());
    setMoveToDialogOpen(false);
  };

  return {
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    isImportFlowDialogOpen,
    setIsImportFlowDialogOpen,
    isImportTableDialogOpen,
    setIsImportTableDialogOpen,
    importTargetFolderId,
    setImportTargetFolderId,
    moveToDialogOpen,
    setMoveToDialogOpen,
    moveToFolderId,
    setMoveToFolderId,
    renameDialogOpen,
    setRenameDialogOpen,
    newName,
    setNewName,
    openRenameDialog,
    handleRename,
    handleBulkMoveTo,
  };
}
