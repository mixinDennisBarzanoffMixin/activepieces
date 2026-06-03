import {
  AppConnectionWithoutSensitiveData,
  ListGlobalConnectionsRequestQuery,
  SeekPage,
} from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { toast } from 'solid-sonner';

import { internalErrorToast } from '@/components/ui/sonner';
import { platformHooks } from '@/hooks/platform-hooks';

import { globalConnectionsApi } from '../api/global-connections';
import {
  NoProjectSelected,
  ConnectionNameAlreadyExists,
  isConnectionNameUnique,
} from '../utils/utils';

type UseGlobalConnectionsProps = {
  request: ListGlobalConnectionsRequestQuery;
  extraKeys: string[];
  staleTime?: number;
  gcTime?: number;
  showErrorDialog?: boolean;
};

const GLOBAL_CONNECTIONS_QUERY_KEY = 'globalConnections';
export const globalConnectionsQueries = {
  getGlobalConnectionsQueryKey: (extraKeys: string[]) => [
    GLOBAL_CONNECTIONS_QUERY_KEY,
    ...extraKeys,
  ],
  useGlobalConnections: ({
    request,
    extraKeys,
    staleTime,
    gcTime,
    showErrorDialog,
  }: UseGlobalConnectionsProps) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return createQuery<SeekPage<AppConnectionWithoutSensitiveData>>(() => ({
      queryKey: [GLOBAL_CONNECTIONS_QUERY_KEY, ...extraKeys],
      staleTime,
      gcTime,
      enabled: platform.plan.globalConnectionsEnabled,
      meta: showErrorDialog
        ? { showErrorDialog: true, loadSubsetOptions: {} }
        : undefined,
      queryFn: () => {
        return globalConnectionsApi.list(request);
      },
    }));
  },
};

export const globalConnectionsMutations = {
  useBulkDeleteGlobalConnections: (refetch: () => void) =>
    createMutation(() => ({
      mutationFn: async (ids: string[]) => {
        await Promise.all(ids.map((id) => globalConnectionsApi.delete(id)));
      },
      onSuccess: () => {
        refetch();
      },
      onError: () => {
        internalErrorToast();
      },
    })),
  useUpdateGlobalConnection: (
    refetch: () => void,
    setIsOpen: (isOpen: boolean) => void,
    editConnectionForm: EditConnectionForm,
  ) =>
    createMutation<
      AppConnectionWithoutSensitiveData,
      Error,
      {
        connectionId: string;
        displayName: string;
        projectIds: string[];
        preSelectForNewProjects: boolean;
        currentName: string;
      }
    >({
      mutationFn: async (params: UpdateGlobalConnectionParams) => {
        const {
          connectionId,
          displayName,
          projectIds,
          preSelectForNewProjects,
          currentName,
        } = params;
        if (
          !(await isConnectionNameUnique({
            isGlobalConnection: true,
            displayName,
          })) &&
          displayName !== currentName
        ) {
          throw new ConnectionNameAlreadyExists();
        }
        if (projectIds.length === 0) {
          throw new NoProjectSelected();
        }
        return globalConnectionsApi.update(connectionId, {
          displayName,
          projectIds,
          preSelectForNewProjects,
        });
      },
      onSuccess: () => {
        refetch();
        toast.success(t('Connection has been updated.'), {
          duration: 3000,
        });
        setIsOpen(false);
      },
      onError: (error) => {
        if (error instanceof ConnectionNameAlreadyExists) {
          editConnectionForm.setError('displayName', {
            message: error.message,
          });
        } else if (error instanceof NoProjectSelected) {
          editConnectionForm.setError('projectIds', {
            message: error.message,
          });
        } else {
          internalErrorToast();
        }
      },
    }),
};

type EditConnectionForm = {
  setError: (
    name: 'displayName' | 'projectIds',
    error: { message: string },
  ) => void;
};

type UpdateGlobalConnectionParams = {
  connectionId: string;
  displayName: string;
  projectIds: string[];
  preSelectForNewProjects: boolean;
  currentName: string;
};
