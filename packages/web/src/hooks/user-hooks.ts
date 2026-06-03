import { isNil } from '@activepieces/shared';
import {
  QueryClient,
  createMutation,
  createQuery,
} from '@tanstack/solid-query';

import { userApi } from '@/api/user-api';
import { queryClient } from '@/app/query-client';
import { authenticationSession } from '@/lib/authentication-session';

export const userHooks = {
  useCurrentUser: () => {
    const userId = authenticationSession.getCurrentUserId();
    const token = authenticationSession.getToken();
    const expired = authenticationSession.isJwtExpired(token!);
    return createQuery(
      () => ({
        queryKey: ['currentUser', userId],
        queryFn: async () => {
          // Skip user data fetch if JWT is expired to prevent redirect to sign-in page
          // This is especially important for embedding scenarios where we need to accept
          // a new JWT token rather than triggering the global error handler

          if (!userId || expired) {
            return null;
          }
          try {
            const result = await userApi.getUserById(userId);
            return result;
          } catch (error) {
            console.error(error);
            return null;
          }
        },
        staleTime: Infinity,
      }),
      () => queryClient,
    );
  },
  useUserById: (id: string | null) => {
    return createQuery(
      () => ({
        queryKey: ['user', id],
        queryFn: async () => {
          try {
            return await userApi.getUserById(id!);
          } catch (error) {
            console.error(error);
            return null;
          }
        },
        enabled: !isNil(id),
        staleTime: Infinity,
      }),
      () => queryClient,
    );
  },
  invalidateCurrentUser: (queryClient: QueryClient) => {
    const userId = authenticationSession.getCurrentUserId();
    void queryClient.invalidateQueries({ queryKey: ['currentUser', userId] });
  },
  getCurrentUserPlatformRole: () => {
    const { data: user } = userHooks.useCurrentUser();
    return user?.platformRole;
  },
};

export const userMutations = {
  useUploadProfilePicture: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError: (error: Error) => void;
  }) => {
    return createMutation(
      () => ({
        mutationFn: (file: File) => userApi.updateMe(file),
        onSuccess,
        onError,
      }),
      () => queryClient,
    );
  },
};
