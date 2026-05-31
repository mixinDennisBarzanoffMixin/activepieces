import {
  CreatePlatformProjectRequest,
  UpdateProjectPlatformRequest,
  isNil,
  ProjectType,
  ProjectWithLimits,
  ProjectWithLimitsWithPlatform,
  SeekPage,
} from '@activepieces/shared';
import { useLocation } from '@solidjs/router';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { createEffect } from 'solid-js';

import { queryClient } from '@/app/query-client';
import { useEmbedding } from '@/components/providers/embed-provider';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

export const projectCollectionUtils = {
  useCreateProject: (
    onSuccess: (project: ProjectWithLimits) => void,
    onError: (error: Error) => void,
  ) => {
    return createMutation(
      () => ({
        mutationFn: (request: CreatePlatformProjectRequest) =>
          api.post<ProjectWithLimits>('/v1/projects', request),
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['platform-projects'] });
          onSuccess(data);
        },
        onError: (error) => {
          onError(error);
        },
      }),
      () => queryClient,
    );
  },
  useUpdateProject: (
    onSuccess: () => void,
    onError: (error: Error) => void,
  ) => {
    return createMutation(
      () => ({
        mutationFn: ({
          projectId,
          request,
        }: {
          projectId: string;
          request: UpdateProjectPlatformRequest;
        }) => api.post<ProjectWithLimits>(`/v1/projects/${projectId}`, request),
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['project', data.id] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['platform-projects'] });
          onSuccess();
        },
        onError,
      }),
      () => queryClient,
    );
  },
  update: (projectId: string, request: UpdateProjectPlatformRequest) => {
    queryClient.setQueriesData<ProjectWithLimits[]>(
      { queryKey: ['projects'] },
      (projects) =>
        projects?.map((project) =>
          project.id === projectId ? { ...project, ...request } : project,
        ),
    );
    queryClient.setQueriesData<ProjectWithLimits[]>(
      { queryKey: ['platform-projects'] },
      (projects) =>
        projects?.map((project) =>
          project.id === projectId ? { ...project, ...request } : project,
        ),
    );
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  },
  delete: (projectIds: string[]) => {
    queryClient.setQueriesData<ProjectWithLimits[]>(
      { queryKey: ['projects'] },
      (projects) =>
        projects?.filter((project) => !projectIds.includes(project.id)),
    );
    queryClient.setQueriesData<ProjectWithLimits[]>(
      { queryKey: ['platform-projects'] },
      (projects) =>
        projects?.filter((project) => !projectIds.includes(project.id)),
    );
  },
  setCurrentProject: (projectId: string, pathName?: string) => {
    authenticationSession.switchToProject(projectId);
    if (pathName) {
      const pathNameWithNewProjectId = pathName.replace(
        /\/projects\/\w+/,
        `/projects/${projectId}`,
      );
      window.location.href = pathNameWithNewProjectId;
    }
  },
  useCurrentProject: () => {
    const projectId = authenticationSession.getProjectId();
    const query = createQuery(
      () => ({
        queryKey: ['project', projectId],
        queryFn: async () => {
          const response = await api.get<SeekPage<ProjectWithLimits>>(
            '/v1/projects',
            { cursor: undefined, limit: 30000 },
          );
          return response.data.find((project) => project.id === projectId);
        },
        enabled: !isNil(projectId),
        staleTime: 60_000,
      }),
      () => queryClient,
    );
    return {
      project: query.data!,
    };
  },
  useAll: () => {
    const currentUserId = authenticationSession.getCurrentUserId();
    return createQuery(
      () => ({
        queryKey: ['projects', currentUserId],
        queryFn: async () => {
          const response = await api.get<SeekPage<ProjectWithLimits>>(
            '/v1/projects',
            { cursor: undefined, limit: 30000 },
          );
          return response.data
            .filter(
              (project) =>
                project.type === ProjectType.TEAM ||
                (project.type === ProjectType.PERSONAL &&
                  project.ownerId === currentUserId),
            )
            .sort((a, b) =>
              a.type === b.type
                ? String(a.created).localeCompare(String(b.created))
                : a.type.localeCompare(b.type),
            );
        },
        enabled: !isNil(currentUserId),
        initialData: [] as ProjectWithLimits[],
        staleTime: 60_000,
      }),
      () => queryClient,
    );
  },
  useAllPlatformProjects: (filters?: {
    displayName?: string;
    type?: ProjectType[];
  }) => {
    return createQuery(
      () => ({
        queryKey: [
          'platform-projects',
          filters?.displayName,
          filters?.type?.join(','),
        ],
        queryFn: async () => {
          const response = await api.get<SeekPage<ProjectWithLimits>>(
            '/v1/projects',
            { cursor: undefined, limit: 30000 },
          );
          return response.data
            .filter(
              (project) =>
                !filters?.displayName ||
                project.displayName
                  .toLowerCase()
                  .includes(filters.displayName.toLowerCase()),
            )
            .filter(
              (project) =>
                !filters?.type?.length || filters.type.includes(project.type),
            )
            .sort((a, b) =>
              a.type === b.type
                ? String(a.created).localeCompare(String(b.created))
                : a.type.localeCompare(b.type),
            );
        },
        staleTime: 60_000,
      }),
      () => queryClient,
    );
  },
  useHasAccessToProject: (projectId: string) => {
    const query = createQuery(
      () => ({
        queryKey: ['project-access', projectId],
        queryFn: async () => {
          const response = await api.get<SeekPage<ProjectWithLimits>>(
            '/v1/projects',
            { cursor: undefined, limit: 30000 },
          );
          return response.data.find((project) => project.id === projectId);
        },
        enabled: !isNil(projectId),
        staleTime: 60_000,
      }),
      () => queryClient,
    );
    return !isNil(query.data);
  },
};

export const getProjectName = (
  project: Pick<ProjectWithLimits, 'type' | 'displayName'>,
): string => {
  return project.type === ProjectType.PERSONAL
    ? 'Personal Project'
    : project.displayName;
};
export const projectHooks = {
  useProjectsForPlatforms: () => {
    return createQuery<ProjectWithLimitsWithPlatform[], Error>(
      () => ({
        queryKey: ['projects-for-platforms'],
        queryFn: async () => {
          return api.get<ProjectWithLimitsWithPlatform[]>('/v1/platforms');
        },
      }),
      () => queryClient,
    );
  },
  useReloadPageIfProjectIdChanged: (projectId: string) => {
    const { embedState } = useEmbedding();
    const location = useLocation();
    createEffect(() => {
      const handleVisibilityChange = () => {
        const currentProjectId = authenticationSession.getProjectId();
        const isTemplateRoute = location.pathname.startsWith('/templates');
        if (
          currentProjectId !== projectId &&
          document.visibilityState === 'visible' &&
          !embedState.isEmbedded &&
          !isTemplateRoute
        ) {
          window.location.reload();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
      };
    }, [projectId, embedState.isEmbedded, location.pathname]);
  },
};
