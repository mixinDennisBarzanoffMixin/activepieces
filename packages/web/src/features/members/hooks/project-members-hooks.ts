import {
  ProjectMemberWithUser,
  ApFlagId,
  assertNotNullOrUndefined,
} from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';

import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { projectMembersApi } from '../api/project-members-api';

export const projectMembersHooks = {
  useProjectMembers: () => {
    const { data } = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_PROJECT_MEMBERS);
    const { platform } = platformHooks.useCurrentPlatform();
    const query = createQuery<ProjectMemberWithUser[]>(() => ({
      queryKey: ['project-members', authenticationSession.getProjectId()],
      queryFn: async () => {
        const projectId = authenticationSession.getProjectId();
        assertNotNullOrUndefined(projectId, 'Project ID is null');
        const res = await projectMembersApi.list({
          projectId: projectId,
          projectRoleId: undefined,
          cursor: undefined,
          limit: 100,
        });
        return res.data;
      },
      enabled: !!data && platform?.plan.projectRolesEnabled === true,
    }));
    return {
      projectMembers: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
  },
};

export const projectMembersMutations = {
  useUpdateMemberRole: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (variables: { memberId: string; role: string }) => void;
    onError: () => void;
  }) => {
    return createMutation(() => ({
      mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
        projectMembersApi.update(memberId, { role }),
      onSuccess: (
        _data: unknown,
        variables: { memberId: string; role: string },
      ) => {
        onSuccess(variables);
      },
      onError,
    }));
  },
};
