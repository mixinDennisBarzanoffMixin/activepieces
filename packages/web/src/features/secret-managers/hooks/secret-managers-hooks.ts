import { SecretManagerConnectionWithStatus } from '@activepieces/shared';
import {
  createMutation,
  createQuery,
  useQueryClient,
} from '@tanstack/solid-query';
import { t } from 'i18next';
import { toast } from 'solid-sonner';

import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { secretManagersApi } from '../api/secret-managers-api';

export const secretManagersHooks = {
  useListSecretManagerConnections: ({
    connectedOnly,
    listForPlatform,
    showErrorDialog,
  }: {
    connectedOnly?: boolean;
    listForPlatform?: boolean;
    showErrorDialog?: boolean;
  } = {}) => {
    const { platform } = platformHooks.useCurrentPlatform();
    const projectId = listForPlatform
      ? undefined
      : authenticationSession.getProjectId()!;
    return createQuery<SecretManagerConnectionWithStatus[]>(() => ({
      queryKey: ['secret-managers', projectId],
      queryFn: async () => {
        const result = await secretManagersApi.list({ projectId });
        if (connectedOnly) {
          return result.data.filter(
            (connection) => connection.connection.connected,
          );
        }
        return result.data;
      },
      enabled: platform.plan.secretManagersEnabled,
      meta: showErrorDialog
        ? { showErrorDialog: true, loadSubsetOptions: {} }
        : undefined,
    }));
  },
  useCreateSecretManagerConnection: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return createMutation(() => ({
      mutationFn: (request) => secretManagersApi.create(request),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Connected successfully'));
        onSuccess();
      },
      onError,
    }));
  },
  useUpdateSecretManagerConnection: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return createMutation(() => ({
      mutationFn: (params: {
        id: string;
        config: Parameters<typeof secretManagersApi.update>[1];
      }) => secretManagersApi.update(params.id, params.config),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Updated successfully'));
        onSuccess();
      },
      onError,
    }));
  },
  useDeleteSecretManagerConnection: () => {
    const queryClient = useQueryClient();
    return createMutation(() => ({
      mutationFn: (id) => secretManagersApi.delete(id),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Deleted successfully'));
      },
    }));
  },
  useClearCache: () => {
    const queryClient = useQueryClient();
    return createMutation(() => ({
      mutationFn: (connectionId) => secretManagersApi.clearCache(connectionId),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Cache cleared successfully'));
      },
    }));
  },
};
