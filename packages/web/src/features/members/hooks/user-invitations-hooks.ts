import { InvitationType, UserInvitation } from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';

import { userInvitationApi } from '../api/user-invitation';

const userInvitationsQueryKey = 'user-invitations';

export const userInvitationsHooks = {
  useInvitations: () => {
    const query = createQuery<UserInvitation[]>(() => ({
      queryFn: () => {
        return userInvitationApi
          .list({
            type: InvitationType.PROJECT,
            cursor: undefined,
            limit: 100,
          })
          .then((res) => res.data);
      },
      queryKey: [userInvitationsQueryKey],
      staleTime: 0,
    }));
    return {
      invitations: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
  },
};

export const userInvitationMutations = {
  useAcceptInvitation: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (registered: boolean) => void;
    onError: (error: unknown) => void;
  }) => {
    return createMutation(() => ({
      mutationFn: async (token: string) => {
        const { registered } = await userInvitationApi.accept(token);
        return registered;
      },
      onSuccess,
      onError,
    }));
  },
};
