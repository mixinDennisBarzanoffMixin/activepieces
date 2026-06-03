import {
  AgentMcpTool,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';

import { flowsApi } from '@/features/flows/api/flows-api';
import { authenticationSession } from '@/lib/authentication-session';

import { mcpToolApi } from '../agent-tools/mcp-tool-dialog/api';

export const agentQueries = {
  useFlowsForAgent: () => {
    const projectId = authenticationSession.getProjectId();
    return createQuery(() => ({
      queryKey: ['flows', projectId],
      queryFn: async () => {
        return await flowsApi.list({
          cursor: undefined,
          limit: 1000,
          projectId: projectId!,
        });
      },
    }));
  },
};

export const agentMutations = {
  useValidateMcpTool: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: ValidateAgentMcpToolResponse) => void;
    onError: (error: Error) => void;
  }) => {
    return createMutation<
      ValidateAgentMcpToolResponse,
      Error,
      { projectId: string; tool: AgentMcpTool }
    >(() => ({
      mutationFn: (request) =>
        mcpToolApi.validateAgentMcpTool(request.projectId, request.tool),
      onSuccess,
      onError,
    }));
  },
};
