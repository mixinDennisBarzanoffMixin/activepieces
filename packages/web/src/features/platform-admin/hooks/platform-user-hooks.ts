import {
  InvitationType,
  isNil,
  Permission,
  SeekPage,
  UpdateUserRequestBody,
  User,
  UserInvitation,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { toast } from 'solid-sonner';

import { platformUserApi } from '@/api/platform-user-api';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

export const platformUserKeys = {
  users: ['users'] as const,
  invitations: ['platform-invitations'] as const,
};

export const platformUserHooks = {
  useUsers: () => {
    const { data: currentUser } = userHooks.useCurrentUser();
    const { checkAccess, isFetchingProjectRole } = useAuthorization();
    const hasInvitePermission = checkAccess(Permission.WRITE_INVITATION);
    const canListUsers =
      !isNil(currentUser) && hasInvitePermission && !isFetchingProjectRole;
    return createQuery<SeekPage<UserWithMetaInformation>, Error>(() => ({
      queryKey: platformUserKeys.users,
      queryFn: async () => {
        const results = await platformUserApi.list({
          limit: 2000,
        });
        return results;
      },
      enabled: canListUsers,
    }));
  },
  usePlatformInvitations: () => {
    return createQuery<UserInvitation[], Error>(() => ({
      queryFn: () => {
        return userInvitationApi
          .list({
            type: InvitationType.PLATFORM,
            cursor: undefined,
            limit: 100,
            projectId: null,
          })
          .then((res) => res.data);
      },
      queryKey: platformUserKeys.invitations,
      staleTime: 0,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    }));
  },
};

export const platformUserMutations = {
  useDeleteUser: ({ onSuccess }: { onSuccess: () => void }) => {
    return createMutation(() => ({
      mutationKey: ['delete-user'],
      mutationFn: async (userId: string) => {
        await platformUserApi.delete(userId);
      },
      onSuccess: () => {
        onSuccess();
        toast.success(t('User deleted successfully'), { duration: 3000 });
      },
    }));
  },
  useDeleteInvitation: ({ onSuccess }: { onSuccess: () => void }) => {
    return createMutation(() => ({
      mutationKey: ['delete-invitation'],
      mutationFn: async (invitationId: string) => {
        await userInvitationApi.delete(invitationId);
      },
      onSuccess: () => {
        onSuccess();
        toast.success(t('Invitation deleted successfully'), { duration: 3000 });
      },
    }));
  },
  useUpdateUserStatus: ({ onSuccess }: { onSuccess: () => void }) => {
    return createMutation(() => ({
      mutationFn: async (data: { userId: string; status: UserStatus }) => {
        await platformUserApi.update(data.userId, { status: data.status });
        return data;
      },
      onSuccess: (data) => {
        onSuccess();
        toast.success(
          data.status === UserStatus.ACTIVE
            ? t('User activated successfully')
            : t('User deactivated successfully'),
          { duration: 3000 },
        );
      },
    }));
  },
  useUpdateUser: ({
    userId,
    onSuccess,
  }: {
    userId: string;
    onSuccess: (user: User) => void;
  }) => {
    return createMutation<User, Error, UpdateUserRequestBody>(() => ({
      mutationKey: ['update-user'],
      mutationFn: (request: UpdateUserRequestBody) =>
        platformUserApi.update(userId, request),
      onSuccess,
    }));
  },
};
