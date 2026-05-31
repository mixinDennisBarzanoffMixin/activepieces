import { PlatformRole, UserStatus } from '@activepieces/shared';
import { t } from 'i18next';
import {
  CircleMinus,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash,
} from 'lucide-solid';
import { createSignal, Show } from 'solid-js';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { UserRowData } from '../index';

import { UpdateUserDialog } from './update-user-dialog';

type UserActionsProps = {
  row: UserRowData;
  isUpdatingStatus: boolean;
  onDelete: (id: string, isInvitation: boolean) => void;
  onToggleStatus: (userId: string, currentStatus: UserStatus) => void;
  onUpdate: () => void;
};

export const UserActions = ({
  row,
  isUpdatingStatus,
  onDelete,
  onToggleStatus,
  onUpdate,
}: UserActionsProps) => {
  const [open, setOpen] = createSignal(false);
  const isInvitation = row.type === 'invitation';
  const isAdmin = !isInvitation && row.data.platformRole === PlatformRole.ADMIN;
  const isActive = !isInvitation && row.data.status === UserStatus.ACTIVE;

  return (
    <div className="flex justify-end">
      <DropdownMenu modal={true} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" class="h-8 w-8 p-0">
            <MoreVertical class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <Show when={!isInvitation}>
            <UpdateUserDialog
              userId={row.data.id}
              role={row.data.platformRole}
              externalId={row.data.externalId ?? undefined}
              onUpdate={onUpdate}
            >
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil class="h-4 w-4" />
                {t('Edit')}
              </DropdownMenuItem>
            </UpdateUserDialog>
          </Show>
          <Show when={!isInvitation}>
            <DropdownMenuItem
              disabled={isAdmin || isUpdatingStatus}
              onSelect={() => {
                onToggleStatus(row.data.id, row.data.status);
                setOpen(false);
              }}
            >
              <Show when={isActive} fallback={<RotateCcw class="h-4 w-4" />}>
                <CircleMinus class="h-4 w-4" />
              </Show>
              {isActive ? t('Deactivate') : t('Activate')}
            </DropdownMenuItem>
          </Show>
          <ConfirmationDeleteDialog
            title={isInvitation ? t('Delete Invitation') : t('Delete User')}
            message={
              isInvitation
                ? t('This invitation will be permanently deleted.')
                : t('This user and all their data will be permanently deleted.')
            }
            entityName={`${isInvitation ? t('Invitation') : t('User')} ${
              row.data.email
            }`}
            mutationFn={async () => {
              onDelete(isInvitation ? row.id : row.data.id, isInvitation);
            }}
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash class="h-4 w-4" />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
