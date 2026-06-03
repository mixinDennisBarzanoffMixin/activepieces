import { Permission, UserInvitation } from '@activepieces/shared';
import { t } from 'i18next';
import { Trash } from 'lucide-solid';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { UserAvatar } from '@/components/custom/user-avatar';
import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { userInvitationApi } from '../api/user-invitation';
import { userInvitationsHooks } from '../hooks/user-invitations-hooks';

export function InvitationCard(props: { invitation: UserInvitation }) {
  const { refetch } = userInvitationsHooks.useInvitations();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToRemoveInvitation = checkAccess(
    Permission.WRITE_INVITATION,
  );
  async function deleteInvitation() {
    await userInvitationApi.delete(props.invitation.id);
    void refetch();
  }
  return (
    <div class="flex items-center justify-between space-x-4">
      <div class="flex items-center space-x-4">
        <UserAvatar
          name={props.invitation.email}
          email={props.invitation.email}
          size={32}
          disableTooltip={true}
        />
        <div>
          <p class="text-sm font-medium leading-none">
            {props.invitation.email} ({props.invitation.projectRole?.name})
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <PermissionNeededTooltip
          hasPermission={userHasPermissionToRemoveInvitation}
        >
          <ConfirmationDeleteDialog
            mutationFn={() => deleteInvitation()}
            entityName={props.invitation.email}
            title={t('Remove {email}', { email: props.invitation.email })}
            message={String(t('This invitation will be revoked immediately.'))}
          >
            <Button
              disabled={!userHasPermissionToRemoveInvitation}
              variant="ghost"
              class="size-8 p-0"
            >
              <Trash class="text-destructive size-4" />
            </Button>
          </ConfirmationDeleteDialog>
        </PermissionNeededTooltip>
      </div>
    </div>
  );
}
