import {
  ProjectMemberWithUser,
  Permission,
  UserInvitation,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/solid-table';
import { t } from 'i18next';
import { Info, Trash2, User, Shield, ChevronDown } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { UserAvatar } from '@/components/custom/user-avatar';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  projectMembersApi,
  userInvitationApi,
  RoleSelector,
  projectMembersMutations,
} from '@/features/members';
import { projectRoleQueries } from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { formatUtils } from '@/lib/format-utils';

export type MemberRowData =
  | {
      id: string;
      type: 'member';
      data: ProjectMemberWithUser;
    }
  | {
      id: string;
      type: 'invitation';
      data: UserInvitation;
    }
  | {
      id: string;
      type: 'platform-admin-operator';
      data: UserWithMetaInformation;
    };

type MembersTableColumnsProps = {
  refetch: () => void;
};

const RoleCell = (props: {
  row: { original: MemberRowData };
  refetch: () => void;
}) => {
  const { data: rolesData, isPending: rolesLoading } =
    projectRoleQueries.useProjectRoles(true);

  const roles = rolesData?.data ?? [];
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();
  const userHasPermissionToUpdateRole = createMemo(
    () =>
      checkAccess(Permission.WRITE_PROJECT_MEMBER) &&
      props.row.original.type === 'member',
  );

  const isOwner = createMemo(
    () =>
      props.row.original.type === 'member' &&
      project.ownerId === props.row.original.data.userId,
  );

  const isPlatformAdminOrOperator = createMemo(
    () => props.row.original.type === 'platform-admin-operator',
  );

  const { mutate, isPending: isAssigningRole } =
    projectMembersMutations.useUpdateMemberRole({
      onSuccess: (variables) => {
        if (props.row.original.type === 'member') {
          const { user } = props.row.original.data;
          toast.success(
            t('{firstName} {lastName} role has become {roleName}', {
              firstName: user.firstName,
              lastName: user.lastName,
              roleName: variables.role,
            }),
          );
        }
        props.refetch();
      },
      onError: () => {
        internalErrorToast();
      },
    });

  const handleValueChange = (value: string) => {
    if (props.row.original.type === 'member') {
      mutate({ memberId: props.row.original.data.id, role: value });
    }
  };

  const roleName = createMemo(() =>
    props.row.original.type === 'member'
      ? props.row.original.data.projectRole.name
      : props.row.original.type === 'platform-admin-operator'
      ? formatUtils.convertEnumToHumanReadable(
          props.row.original.data.platformRole,
        )
      : props.row.original.data.projectRole?.name ?? '',
  );

  return (
    <Show
      when={!isOwner() && !isPlatformAdminOrOperator()}
      fallback={<span class="text-sm">{roleName()}</span>}
    >
      <Show
        when={props.row.original.type !== 'invitation'}
        fallback={
          <div class="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info class="h-4 w-4 text-orange-700 absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Pending Invitation')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              class="w-[150px] justify-between cursor-not-allowed"
              disabled={true}
            >
              <span>{roleName()}</span>
              <ChevronDown class="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </div>
        }
      >
        <PermissionNeededTooltip
          hasPermission={userHasPermissionToUpdateRole()}
        >
          <div class="w-[150px]">
            <RoleSelector
              type="project"
              value={roleName()}
              onValueChange={handleValueChange}
              disabled={!userHasPermissionToUpdateRole()}
              roles={roles}
              isLoading={rolesLoading}
              isAssigningRole={isAssigningRole}
            />
          </div>
        </PermissionNeededTooltip>
      </Show>
    </Show>
  );
};

const ActionsCell = (props: {
  row: { original: MemberRowData };
  refetch: () => void;
}) => {
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();

  const userHasPermissionToDelete = createMemo(() =>
    props.row.original.type === 'member'
      ? checkAccess(Permission.WRITE_PROJECT_MEMBER)
      : checkAccess(Permission.WRITE_INVITATION),
  );

  const isOwner = createMemo(
    () =>
      props.row.original.type === 'member' &&
      project.ownerId === props.row.original.data.userId,
  );

  const isPlatformAdminOrOperator = createMemo(
    () => props.row.original.type === 'platform-admin-operator',
  );

  const deleteMember = async () => {
    if (props.row.original.type === 'member') {
      await projectMembersApi.delete(props.row.original.data.id);
    } else {
      await userInvitationApi.delete(props.row.original.data.id);
    }
    props.refetch();
  };

  const displayName = createMemo(() =>
    props.row.original.type === 'member'
      ? `${props.row.original.data.user.firstName} ${props.row.original.data.user.lastName}`
      : props.row.original.data.email,
  );

  return (
    <Show when={!isOwner() && !isPlatformAdminOrOperator()}>
      <PermissionNeededTooltip hasPermission={userHasPermissionToDelete()}>
        <ConfirmationDeleteDialog
          title={
            props.row.original.type === 'invitation'
              ? t('Remove Invitation')
              : t('Remove Member')
          }
          message={
            props.row.original.type === 'invitation'
              ? String(t('This invitation will be revoked immediately.'))
              : String(
                  t('This member will lose access to the project immediately.'),
                )
          }
          mutationFn={() => deleteMember()}
          entityName={displayName()}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={!userHasPermissionToDelete()}
            class="h-8 w-8 p-0"
          >
            <Trash2 class="h-4 w-4 text-destructive" />
          </Button>
        </ConfirmationDeleteDialog>
      </PermissionNeededTooltip>
    </Show>
  );
};

export const membersTableColumns = (
  props: MembersTableColumnsProps,
): (ColumnDef<RowDataWithActions<MemberRowData>> & {
  accessorKey: string;
})[] => [
  {
    accessorKey: 'member',
    size: 250,
    header: (args) => (
      <DataTableColumnHeader
        column={args.column}
        title={t('User Name')}
        icon={User}
      />
    ),
    cell: (args) => {
      const email = createMemo(() =>
        args.row.original.type === 'member'
          ? args.row.original.data.user.email
          : args.row.original.data.email,
      );
      const name = createMemo(() =>
        args.row.original.type === 'member'
          ? `${args.row.original.data.user.firstName} ${args.row.original.data.user.lastName}`
          : args.row.original.type === 'platform-admin-operator'
          ? `${args.row.original.data.firstName} ${args.row.original.data.lastName}`
          : args.row.original.data.email,
      );

      return (
        <Show
          when={args.row.original.type !== 'invitation'}
          fallback={
            <div class="flex items-center space-x-4 min-w-0">
              <UserAvatar
                name={email()}
                email={email()}
                size={32}
                disableTooltip={true}
              />
              <div class="flex flex-col gap-1 min-w-0">
                <TextWithTooltip tooltipMessage={email()}>
                  <p class="text-sm text-orange-700">{email()}</p>
                </TextWithTooltip>
              </div>
            </div>
          }
        >
          <Show
            when={args.row.original.type !== 'platform-admin-operator'}
            fallback={
              <div class="flex items-center space-x-4 min-w-0">
                <UserAvatar
                  name={name()}
                  email={email()}
                  size={32}
                  disableTooltip={true}
                  imageUrl={
                    args.row.original.type === 'platform-admin-operator'
                      ? args.row.original.data.imageUrl
                      : undefined
                  }
                />
                <div class="flex flex-col gap-1 min-w-0">
                  <p class="text-sm font-medium leading-none">{name()}</p>
                  <TextWithTooltip tooltipMessage={email()}>
                    <p class="text-sm text-muted-foreground">{email()}</p>
                  </TextWithTooltip>
                </div>
              </div>
            }
          >
            <div class="flex items-center space-x-4 min-w-0">
              <UserAvatar
                name={name()}
                email={email()}
                size={32}
                disableTooltip={true}
              />
              <div class="flex flex-col gap-1 min-w-0">
                <p class="text-sm font-medium leading-none">{name()}</p>
                <TextWithTooltip tooltipMessage={email()}>
                  <p class="text-sm text-muted-foreground">{email()}</p>
                </TextWithTooltip>
              </div>
            </div>
          </Show>
        </Show>
      );
    },
  },
  {
    accessorKey: 'role',
    size: 180,
    header: (args) => (
      <DataTableColumnHeader
        column={args.column}
        title={t('Role')}
        icon={Shield}
      />
    ),
    cell: (args) => {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <RoleCell row={args.row} refetch={props.refetch} />
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: (args) => <DataTableColumnHeader column={args.column} title="" />,
    cell: (args) => {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionsCell row={args.row} refetch={props.refetch} />
        </div>
      );
    },
  },
];
