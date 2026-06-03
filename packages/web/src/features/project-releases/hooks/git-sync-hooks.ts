import {
  ConfigureRepoRequest,
  GitBranchType,
  GitRepo,
  isNil,
  Permission,
  PushGitRepoRequest,
} from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { gitSyncApi } from '../api/git-sync-api';

export const gitSyncHooks = {
  useGitSync: (projectId: string, enabled: boolean) => {
    const query = createQuery(() => ({
      queryKey: ['git-sync', projectId],
      queryFn: () => gitSyncApi.get(projectId),
      staleTime: Infinity,
      enabled: enabled,
    }));
    return {
      gitSync: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
  },
  useShowPushToGit: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { gitSync } = gitSyncHooks.useGitSync(
      authenticationSession.getProjectId()!,
      platform?.plan.environmentsEnabled === true,
    );
    const userHasPermissionToPushToGit = useAuthorization().checkAccess(
      Permission.WRITE_PROJECT_RELEASE,
    );

    return (
      userHasPermissionToPushToGit &&
      !isNil(gitSync) &&
      gitSync.branchType === GitBranchType.DEVELOPMENT
    );
  },
};

export const gitSyncMutations = {
  usePushToGit: ({ onSuccess }: { onSuccess: () => void }) => {
    return createMutation(() => ({
      mutationFn: async ({
        gitSyncId,
        request,
      }: {
        gitSyncId: string;
        request: PushGitRepoRequest;
      }) => {
        await gitSyncApi.push(gitSyncId, request);
      },
      onSuccess,
    }));
  },
  useConfigureGitSync: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (repo: GitRepo) => void;
    onError: (error: unknown) => void;
  }) => {
    return createMutation(() => ({
      mutationFn: (request: ConfigureRepoRequest): Promise<GitRepo> => {
        return gitSyncApi.configure(request);
      },
      onSuccess,
      onError,
    }));
  },
  useDisconnectGitSync: ({ onSuccess }: { onSuccess: () => void }) => {
    return createMutation(() => ({
      mutationFn: (gitSyncId: string) => {
        return gitSyncApi.disconnect(gitSyncId);
      },
      onSuccess,
    }));
  },
};
