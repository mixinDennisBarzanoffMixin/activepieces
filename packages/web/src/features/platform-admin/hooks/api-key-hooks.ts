import { ApiKeyResponseWithoutValue, SeekPage } from '@activepieces/shared';
import {
  createMutation,
  createQuery,
  useQueryClient,
} from '@tanstack/solid-query';

import { apiKeyApi } from '../api/api-key-api';

export const apiKeyKeys = {
  all: ['api-keys'] as const,
};

export const apiKeyQueries = {
  useApiKeys: () =>
    createQuery<SeekPage<ApiKeyResponseWithoutValue>>(() => ({
      queryKey: apiKeyKeys.all,
      gcTime: 0,
      staleTime: 0,
      queryFn: () => apiKeyApi.list(),
    })),
};

export const apiKeyMutations = {
  useCreateApiKey: ({ onSuccess }: { onSuccess: () => void }) => {
    return createMutation(() => ({
      mutationFn: (request: { displayName: string }) =>
        apiKeyApi.create(request),
      onSuccess,
    }));
  },
  useDeleteApiKey: () => {
    const queryClient = useQueryClient();
    return createMutation(() => ({
      mutationFn: (keyId: string) => apiKeyApi.delete(keyId),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
      },
    }));
  },
};
