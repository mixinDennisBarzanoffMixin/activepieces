import {
  InvitationType,
  Permission,
  PlatformRole,
  ProjectMemberWithUser,
  SeekPage,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Users } from 'lucide-solid';
import { createMemo, createSignal, Show } from 'solid-js';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { DataTable } from '@/components/custom/data-table';
import { DataTableInputPopover } from '@/components/custom/data-table/data-table-input-popover';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import {
  InviteUserDialog,
  projectMembersHooks,
  userInvitationsHooks,
} from '@/features/members';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { membersTableColumns, MemberRowData } from './columns';

export const MembersSettings = () => {
  const {
    projectMembers,
    isLoading: projectMembersIsPending,
    refetch: refetchProjectMembers,
  }: {
    projectMembers: ProjectMemberWithUser[] | undefined;
    isLoading: boolean;
    refetch: () => Promise<unknown>;
  } = projectMembersHooks.useProjectMembers();
  const {
    invitations,
    isLoading: invitationsIsPending,
    refetch: refetchInvitations,
  } = userInvitationsHooks.useInvitations();
  const {
    data: platformUsersData,
    isLoading: platformUsersIsPending,
  }: {
    data: SeekPage<UserWithMetaInformation> | undefined;
    isLoading: boolean;
  } = platformUserHooks.useUsers();

  const [filterValue, setFilterValue] = createSignal('');
  const [inviteOpen, setInviteOpen] = createSignal(false);

  const { checkAccess } = useAuthorization();
  const userHasPermissionToInviteUser = checkAccess(
    Permission.WRITE_INVITATION,
  );

  const refetch = () => {
    void refetchProjectMembers();
    void refetchInvitations();
  };

  const combinedData = createMemo<MemberRowData[]>(() => {
    const currentProjectId = authenticationSession.getProjectId();

    const members: MemberRowData[] =
      projectMembers
        ?.filter((member) => member.user.status === UserStatus.ACTIVE)
        .map((member) => ({
          id: member.id,
          type: 'member' as const,
          data: member,
        })) ?? [];

    const pendingInvitations: MemberRowData[] =
      invitations
        ?.filter(
          (invitation) =>
            invitation.projectId === currentProjectId &&
            invitation.type === InvitationType.PROJECT,
        )
        .map((invitation) => ({
          id: invitation.id,
          type: 'invitation' as const,
          data: invitation,
        })) ?? [];

    const projectMemberEmails = new Set(
      projectMembers?.map((member) => member.user.email.toLowerCase()) ?? [],
    );

    const platformAdminsAndOperators: MemberRowData[] =
      platformUsersData?.data
        .filter(
          (user) =>
            user.status === UserStatus.ACTIVE &&
            (user.platformRole === PlatformRole.ADMIN ||
              user.platformRole === PlatformRole.OPERATOR) &&
            !projectMemberEmails.has(user.email.toLowerCase()),
        )
        .map((user) => ({
          id: user.id,
          type: 'platform-admin-operator' as const,
          data: user,
        })) ?? [];

    return [...members, ...platformAdminsAndOperators, ...pendingInvitations];
  });

  const filteredData = createMemo(() => {
    if (!filterValue()) {
      return combinedData();
    }
    const searchValue = filterValue().toLowerCase();
    return combinedData().filter((row) => {
      if (row.type === 'member') {
        const fullName =
          `${row.data.user.firstName} ${row.data.user.lastName}`.toLowerCase();
        const email = row.data.user.email.toLowerCase();
        return fullName.includes(searchValue) || email.includes(searchValue);
      } else if (row.type === 'platform-admin-operator') {
        const fullName =
          `${row.data.firstName} ${row.data.lastName}`.toLowerCase();
        const email = row.data.email.toLowerCase();
        return fullName.includes(searchValue) || email.includes(searchValue);
      } else {
        const email = row.data.email.toLowerCase();
        return email.includes(searchValue);
      }
    });
  });

  const columns = createMemo(() =>
    membersTableColumns({
      refetch,
    }),
  );

  return (
    <div class="space-y-4">
      <div class="flex items-center gap-2 justify-between">
        <DataTableInputPopover
          title={t('Search')}
          filterValue={filterValue}
          handleFilterChange={setFilterValue}
        />
        {
          <Show when={userHasPermissionToInviteUser}>
            <AnimatedIconButton
              icon={UserRoundPlusIcon}
              iconSize={16}
              onClick={() => setInviteOpen(true)}
            >
              {t('Add Members')}
            </AnimatedIconButton>
          </Show>
        }
      </div>
      <DataTable
        columns={columns}
        page={{
          data: filteredData(),
          next: null,
          previous: null,
        }}
        isLoading={
          projectMembersIsPending ||
          invitationsIsPending ||
          platformUsersIsPending
        }
        hidePagination={true}
        emptyStateTextTitle={t('No members found')}
        emptyStateTextDescription={t(
          'Start by inviting team members to collaborate.',
        )}
        emptyStateIcon={<Users class="size-14" />}
      />
      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
    </div>
  );
};
