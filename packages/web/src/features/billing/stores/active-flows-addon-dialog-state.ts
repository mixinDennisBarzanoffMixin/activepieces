import { createWithStore } from 'solid-zustand';

interface ActiveFlowsAddonDialogStore {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useManagePlanDialogStore =
  createWithStore<ActiveFlowsAddonDialogStore>((set) => ({
    isOpen: false,
    openDialog: () => set({ isOpen: true }),
    closeDialog: () => set({ isOpen: false }),
  }));
