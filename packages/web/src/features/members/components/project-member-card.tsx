import { ProjectMemberWithUser, Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { Trash } from 'lucide-solid';
import { Show } from 'solid-js';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { UserAvatar } from '@/components/custom/user-avatar';
import { Button } from '@/components/ui/button';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { projectMembersApi } from '../api/project-members-api';
import { projectMembersHooks } from '../hooks/project-members-hooks';

import { EditRoleDialog } from './edit-role-dialog';

type ProjectMemberCardProps = {
  member: ProjectMemberWithUser;
  onUpdate: () => void;
};

export function ProjectMemberCard(props: ProjectMemberCardProps) {
  const { refetch } = projectMembersHooks.useProjectMembers();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToRemoveMember = checkAccess(
    Permission.WRITE_PROJECT_MEMBER,
  );
  const { project } = projectCollectionUtils.useCurrentProject();
  const deleteMember = async () => {
    await projectMembersApi.delete(props.member.id);
    void refetch();
    props.onUpdate();
  };

  return (
    <div class="w-full flex items-center justify-between space-x-4">
      <div class="flex items-center space-x-4">
        <UserAvatar
          name={props.member.user.firstName + ' ' + props.member.user.lastName}
          email={props.member.user.email}
          size={32}
          disableTooltip={true}
        />
        <div class="flex flex-col gap-1">
          <p class="text-sm font-medium leading-none">
            {props.member.user.firstName} {props.member.user.lastName} (
            {props.member.projectRole.name})
          </p>
          <p class="text-sm text-muted-foreground">{props.member.user.email}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Show when={project.ownerId !== props.member.userId}>
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToRemoveMember}
          >
            <EditRoleDialog
              member={props.member}
              onSave={() => {
                void refetch();
              }}
              disabled={!userHasPermissionToRemoveMember}
            />
            <ConfirmationDeleteDialog
              title={t('Remove Member')}
              message={String(
                t('This member will lose access to the project immediately.'),
              )}
              mutationFn={() => deleteMember()}
              entityName={`${props.member.user.firstName} ${props.member.user.lastName}`}
            >
              <Button
                disabled={!userHasPermissionToRemoveMember}
                variant="ghost"
                class="size-8 p-0"
              >
                <Trash class="text-destructive size-4" />
              </Button>
            </ConfirmationDeleteDialog>
          </PermissionNeededTooltip>
        </Show>
      </div>
    </div>
  );
}
