import {
  createQuery,
  createMutation,
  useQueryClient,
} from '@tanstack/solid-query';

import { mcpApi } from './mcp-api';

export const MCP_SERVER_QUERY_KEY = ['mcp-server'];

export const mcpHooks = {
  useMcpServer(projectId: string, options: { enabled?: boolean } = {}) {
    return createQuery(() => ({
      queryKey: [...MCP_SERVER_QUERY_KEY, projectId],
      queryFn: () => mcpApi.get(projectId),
      retry: false,
      enabled: !!projectId && (options.enabled ?? true),
    }));
  },

  useUpdateMcpServer(projectId: string) {
    const queryClient = useQueryClient();

    return createMutation(() => ({
      mutationFn: (input: Parameters<typeof mcpApi.update>[1]) =>
        mcpApi.update(projectId, input),
      onSuccess: (data) => {
        queryClient.setQueryData([...MCP_SERVER_QUERY_KEY, projectId], data);
      },
    }));
  },

  useRotateMcpToken(projectId: string) {
    const queryClient = useQueryClient();

    return createMutation(() => ({
      mutationFn: () => mcpApi.rotateToken(projectId),
      onSuccess: (data) => {
        queryClient.setQueryData([...MCP_SERVER_QUERY_KEY, projectId], data);
      },
    }));
  },
};
