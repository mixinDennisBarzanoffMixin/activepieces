import { AgentMcpTool } from '@activepieces/shared';
import { createWithStore } from 'solid-zustand';

interface McpToolDialogState {
  showAddMcpDialog: boolean;
  editingMcpTool: AgentMcpTool | null;

  resetDialogState: () => void;
  closeMcpDialog: () => void;
  setShowAddMcpDialog: (show: boolean, tool?: AgentMcpTool) => void;
}

const initialState = {
  showAddMcpDialog: false,
  editingMcpTool: null,
};

export const useMcpToolDialogStore = createWithStore<McpToolDialogState>((set, get) => ({
  ...initialState,

  setShowAddMcpDialog: (show, tool) =>
    set({ showAddMcpDialog: show, editingMcpTool: tool }),

  resetDialogState: () => {
    set({
      editingMcpTool: null,
    });
  },

  closeMcpDialog: () => {
    get().resetDialogState();
    set({ showAddMcpDialog: false });
  },
}));
