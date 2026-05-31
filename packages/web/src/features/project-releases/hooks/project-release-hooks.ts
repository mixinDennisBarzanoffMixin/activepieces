import { DiffReleaseRequest, ProjectSyncPlan } from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';

import { internalErrorToast } from '@/components/ui/sonner';
import { authenticationSession } from '@/lib/authentication-session';

import { projectReleaseApi } from '../api/project-release-api';

export const projectReleaseKeys = {
  all: ['project-releases'] as const,
  detail: (releaseId: string) => ['release', releaseId] as const,
};

export const projectReleaseQueries = {
  useProjectReleases: () =>
    createQuery(() => ({
      queryKey: projectReleaseKeys.all,
      queryFn: () =>
        projectReleaseApi.list({
          projectId: authenticationSession.getProjectId()!,
        }),
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    })),
  useProjectRelease: (releaseId: string, enabled: boolean) =>
    createQuery(() => ({
      queryKey: projectReleaseKeys.detail(releaseId),
      queryFn: () => projectReleaseApi.get(releaseId),
      enabled,
    })),
};

export const projectReleaseMutations = {
  useDiffRelease: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (plan: ProjectSyncPlan) => void;
    onError: () => void;
  }) => {
    return createMutation(() => ({
      mutationFn: (request: DiffReleaseRequest) =>
        projectReleaseApi.diff(request),
      onSuccess,
      onError: () => {
        onError();
        internalErrorToast();
      },
    }));
  },
  useApplyRelease: ({ onSuccess }: { onSuccess: () => void }) => {
    return createMutation(() => ({
      mutationFn: (request: Parameters<typeof projectReleaseApi.create>[0]) =>
        projectReleaseApi.create(request),
      onSuccess,
    }));
  },
};
