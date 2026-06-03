import { ProjectRole, SeekPage } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Eye,
  PenLine,
  Pencil,
  Shield,
  ShieldCheck,
  Trash,
  Users,
} from 'lucide-solid';
import { createSignal, For, Show } from 'solid-js';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton';
import { projectRoleMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { ProjectRoleDialog } from './project-role-dialog';
import { ProjectRoleUsersSheet } from './project-role-users-table';

interface ProjectRolesListProps {
  projectRoles: SeekPage<ProjectRole> | undefined;
  isLoading: boolean;
  refetch: () => void;
}

function getRoleIcon(roleName: string) {
  switch (roleName) {
    case 'Admin':
      return <ShieldCheck />;
    case 'Editor':
      return <PenLine />;
    case 'Viewer':
      return <Eye />;
    default:
      return <Shield />;
  }
}

export const ProjectRolesTable = (props: ProjectRolesListProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [selectedRole, setSelectedRole] = createSignal<ProjectRole | null>(
    null,
  );
  const [isUsersSheetOpen, setIsUsersSheetOpen] = createSignal(false);

  const { mutate: deleteProjectRole } =
    projectRoleMutations.useDeleteProjectRole({
      onSuccess: () => props.refetch(),
    });

  if (props.isLoading) {
    return <SkeletonList numberOfItems={3} class="w-full h-[60px]" />;
  }

  const roles = props.projectRoles?.data ?? [];

  if (roles.length === 0) {
    return (
      <div class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
        <Shield class="size-10" />
        <p class="text-sm">
          {t('No project roles yet. Create one to get started.')}
        </p>
      </div>
    );
  }

  return (
    <>
      <ItemGroup class="gap-2">
        <For each={roles}>
          {(role) => (
            <Item key={role.id} variant="outline" size="sm">
              <ItemMedia variant="icon">{getRoleIcon(role.name)}</ItemMedia>
              <ItemContent>
                <ItemTitle>{role.name}</ItemTitle>
                <ItemDescription>
                  <Badge
                    variant={role.type === 'DEFAULT' ? 'accent' : 'secondary'}
                  >
                    {role.type === 'DEFAULT' ? t('Default') : t('Custom')}
                  </Badge>
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="sm"
                  class="flex items-center gap-1.5 px-2 h-8 text-muted-foreground"
                  onClick={() => {
                    setSelectedRole(role);
                    setIsUsersSheetOpen(true);
                  }}
                >
                  <Users class="size-4" />
                  <span class="text-xs">
                    <Show
                      when={role.userCount === 1}
                      fallback={t(`${role.userCount} users`)}
                    >
                      t('1 user'
                    </Show>
                  </span>
                </Button>
                <ProjectRoleDialog
                  mode="edit"
                  projectRole={role}
                  platformId={platform.id}
                  onSave={() => props.refetch()}
                  disabled={role.type === 'DEFAULT'}
                >
                  <Button variant="ghost" size="sm" class="size-8 p-0">
                    <Show
                      when={role.type === 'DEFAULT'}
                      fallback={<Pencil class="size-4" />}
                    >
                      <Eye class="size-4" />
                    </Show>
                  </Button>
                </ProjectRoleDialog>
                <Show when={role.type !== 'DEFAULT'}>
                  <ConfirmationDeleteDialog
                    isDanger={true}
                    title={t('Delete Role')}
                    message={t(
                      'Deleting this role will remove {count} project member(s) and all associated invitations.',
                      { count: role.userCount },
                    )}
                    entityName={`${t('Project Role')} ${role.name}`}
                    buttonText={t('Delete Role')}
                    mutationFn={() => deleteProjectRole(role.name)}
                  >
                    <Button variant="ghost" size="sm" class="size-8 p-0">
                      <Trash class="size-4 text-destructive" />
                    </Button>
                  </ConfirmationDeleteDialog>
                </Show>
              </ItemActions>
            </Item>
          )}
        </For>
      </ItemGroup>
      <ProjectRoleUsersSheet
        projectRole={selectedRole}
        isOpen={isUsersSheetOpen}
        onOpenChange={setIsUsersSheetOpen}
      />
    </>
  );
};
