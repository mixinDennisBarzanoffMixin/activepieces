import { ProjectMemberWithUser } from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Pencil } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { internalErrorToast } from '@/components/ui/sonner';
import { projectRoleApi } from '@/features/platform-admin/api/project-role-api';

import { projectMembersApi } from '../api/project-members-api';

import { RoleSelector } from './role-selector';

interface EditRoleDialogProps {
  member: ProjectMemberWithUser;
  onSave: () => void;
  disabled: boolean;
}

export function EditRoleDialog(props: EditRoleDialogProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedRole, setSelectedRole] = createSignal(
    props.member.projectRole.name,
  );
  const { data: rolesData, isPending: rolesLoading } = createQuery(() => ({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
  }));

  const roles = rolesData?.data ?? [];

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: (newRole: string) => {
      return projectMembersApi.update(props.member.id, {
        role: newRole,
      });
    },
    onSuccess: (_data, roleName) => {
      toast.success(
        t('{firstName} {lastName} role has become {roleName}', {
          firstName: props.member.user.firstName,
          lastName: props.member.user.lastName,
          roleName,
        }),
        {
          duration: 3000,
        },
      );
      props.onSave();
      setIsOpen(false);
    },
    onError: () => {
      internalErrorToast();
    },
  }));

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
  };

  const handleSave = () => {
    mutate(selectedRole);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" class="size-8 p-0" disabled={props.disabled}>
          <Pencil class="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent class="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('Edit Role for')} {props.member.user.firstName}{' '}
            {props.member.user.lastName}
          </DialogTitle>
        </DialogHeader>
        <div class="grid gap-2">
          <RoleSelector
            type="project"
            value={selectedRole}
            onValueChange={handleRoleChange}
            roles={roles}
            isLoading={rolesLoading}
            isAssigningRole={isPending}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} loading={isPending}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
