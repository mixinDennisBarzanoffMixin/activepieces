import { McpServer, UpdateMcpServerRequest } from '@activepieces/shared';
import {
  createMutation,
  createQuery,
  useQueryClient,
} from '@tanstack/solid-query';

import { platformMcpApi } from './platform-mcp-api';

const QUERY_KEY = ['platform-mcp-server'];

export const platformMcpHooks = {
  usePlatformMcpServer() {
    return createQuery<McpServer, Error>(() => ({
      queryKey: QUERY_KEY,
      queryFn: () => platformMcpApi.get(),
      retry: false,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    }));
  },

  useUpdatePlatformMcpTools() {
    const queryClient = useQueryClient();
    return createMutation<McpServer, Error, UpdateMcpServerRequest>(() => ({
      mutationFn: platformMcpApi.update,
      onSuccess: (data) => {
        queryClient.setQueryData(QUERY_KEY, data);
      },
    }));
  },
};
