import { createWithStore } from 'solid-zustand';

interface FlowToolDialogState {
  showAddFlowDialog: boolean;
  setShowAddFlowDialog: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  resetDialogState: () => void;
}

const initialState = {
  showAddFlowDialog: false,
  searchQuery: '',
};

export const useFlowToolDialogStore = createWithStore<FlowToolDialogState>(
  (set) => ({
    ...initialState,

    setShowAddFlowDialog: (show) => set({ showAddFlowDialog: show }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    resetDialogState: () => {
      set({
        searchQuery: '',
      });
    },
  }),
);
