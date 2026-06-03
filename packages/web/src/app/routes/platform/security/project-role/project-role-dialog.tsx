import { Permission, ProjectRole, RoleType } from '@activepieces/shared';
import { t } from 'i18next';
import { createSignal, For, mergeProps, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { projectRoleMutations } from '@/features/platform-admin';

const initialPermissions = [
  {
    name: 'Project',
    description: 'Project settings and configuration',
    read: [Permission.READ_PROJECT],
    write: [Permission.READ_PROJECT, Permission.WRITE_PROJECT],
    disableNone: true,
  },
  {
    name: 'Flows',
    description: 'Read and write flows',
    read: [Permission.READ_FLOW],
    write: [Permission.READ_FLOW, Permission.WRITE_FLOW],
    disableNone: true,
  },
  {
    name: 'Flow Status',
    description: 'Update flow status',
    disableRead: true,
    read: [],
    write: [Permission.UPDATE_FLOW_STATUS],
  },
  {
    name: 'App Connections',
    description: 'Read and write app connections',
    read: [Permission.READ_APP_CONNECTION],
    write: [Permission.READ_APP_CONNECTION, Permission.WRITE_APP_CONNECTION],
  },
  {
    name: 'Runs',
    description: 'Read and write runs',
    read: [Permission.READ_RUN],
    write: [Permission.READ_RUN, Permission.WRITE_RUN],
  },
  {
    name: 'Alerts',
    description: 'Read and write alerts',
    read: [Permission.READ_ALERT],
    write: [Permission.READ_ALERT, Permission.WRITE_ALERT],
  },
  {
    name: 'Folders',
    description: 'Read and write folders',
    read: [Permission.READ_FOLDER],
    write: [Permission.READ_FOLDER, Permission.WRITE_FOLDER],
  },
  {
    name: 'Project Members',
    description: 'Read and write project members',
    read: [Permission.READ_PROJECT_MEMBER],
    write: [Permission.READ_PROJECT_MEMBER, Permission.WRITE_PROJECT_MEMBER],
  },
  {
    name: 'Invitations',
    description: 'Read and write invitations',
    read: [Permission.READ_INVITATION],
    write: [Permission.READ_INVITATION, Permission.WRITE_INVITATION],
  },
  {
    name: 'Project Releases',
    description: 'Read and write project releases',
    read: [Permission.READ_PROJECT_RELEASE],
    write: [Permission.READ_PROJECT_RELEASE, Permission.WRITE_PROJECT_RELEASE],
  },
  {
    name: 'Tables',
    description: 'Read and write tables',
    read: [Permission.READ_TABLE],
    write: [Permission.READ_TABLE, Permission.WRITE_TABLE],
  },
  {
    name: 'MCP',
    description: 'Read and write MCP',
    read: [Permission.READ_MCP],
    write: [Permission.READ_MCP, Permission.WRITE_MCP],
  },
];
interface ProjectRoleDialogProps {
  mode: 'create' | 'edit';
  projectRole?: ProjectRole;
  platformId: string;
  onSave: () => void;
  children: JSX.Element;
  disabled?: boolean;
}

export const ProjectRoleDialog = (_props: ProjectRoleDialogProps) => {
  const props = mergeProps({ disabled: false }, _props);
  const [isOpen, setIsOpen] = createSignal(false);
  const [roleName, setRoleName] = createSignal(props.projectRole?.name || '');
  const [permissions, setPermissions] = createSignal<string[]>(() => {
    if (!props.projectRole?.permissions) {
      // Set default Read permissions for any permission with disableNone
      const defaultPermissions = new Set<string>();
      initialPermissions.forEach((permission) => {
        if (permission.disableNone) {
          permission.read.forEach((p) => defaultPermissions.add(p));
        }
      });
      return Array.from(defaultPermissions);
    }
    return props.projectRole.permissions;
  });
  const { mutate } = projectRoleMutations.useUpsertProjectRole({
    onSave: () => {
      setIsOpen(false);
      props.onSave();
    },
  });

  const handlePermissionChange = (permission: string, level: string) => {
    const currentPermission = initialPermissions.find(
      (p) => p.name === permission,
    );
    const updatedPermissions = new Set(permissions);

    if (currentPermission?.disableNone) {
      currentPermission.read.forEach((p) => updatedPermissions.delete(p));
      currentPermission.write.forEach((p) => updatedPermissions.delete(p));

      if (level === 'Read') {
        currentPermission.read.forEach((p) => updatedPermissions.add(p));
      } else if (level === 'Write') {
        currentPermission.write.forEach((p) => updatedPermissions.add(p));
      }
    } else {
      if (level === 'None') {
        currentPermission?.read.forEach((p) => updatedPermissions.delete(p));
        currentPermission?.write.forEach((p) => updatedPermissions.delete(p));
      } else if (level === 'Read') {
        currentPermission?.write.forEach((p) => updatedPermissions.delete(p));
        currentPermission?.read.forEach((p) => updatedPermissions.add(p));
      } else if (level === 'Write') {
        currentPermission?.write.forEach((p) => updatedPermissions.add(p));
      }
    }
    setPermissions(Array.from(updatedPermissions));
  };

  const getButtonVariant = (permission: string, level: string) => {
    const currentPermission = initialPermissions.find(
      (p) => p.name === permission,
    );
    const writePermissions = new Set(currentPermission?.write || []);
    const readPermissions = new Set(currentPermission?.read || []);
    const currentPermissionsSet = new Set(permissions);

    const hasWritePermissions =
      writePermissions.size > 0 &&
      [...writePermissions].every((p) => currentPermissionsSet.has(p));

    const hasReadPermissions =
      readPermissions.size > 0 &&
      [...readPermissions].every((p) => currentPermissionsSet.has(p)) &&
      !hasWritePermissions;

    if (level === 'Write' && hasWritePermissions) {
      return 'default';
    } else if (level === 'Read' && hasReadPermissions) {
      return 'default';
    } else if (
      level === 'None' &&
      !hasReadPermissions &&
      !hasWritePermissions
    ) {
      return 'default';
    }
    return 'ghost';
  };
  const handleSubmit = () => {
    if (!props.disabled) {
      mutate({
        mode: props.mode,
        roleId: props.projectRole?.id,
        name: roleName,
        permissions,
        type: RoleType.CUSTOM,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent class="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {props.mode === 'create'
              ? t('Create Role')
              : props.projectRole?.type === RoleType.DEFAULT
              ? t('View Role: {name}', { name: props.projectRole.name })
              : t('Edit Role: {name}', { name: props.projectRole?.name })}
          </DialogTitle>
          <DialogDescription>
            <Show
              when={props.mode === 'create'}
              fallback={t('Review and manage permissions for this role.')}
            >
              {t(
                'Define a custom role with specific permissions for project members.',
              )}
            </Show>
          </DialogDescription>
        </DialogHeader>
        <div class="grid space-y-4 mt-4">
          <div>
            <span class="text-sm font-medium text-foreground">{t('Name')}</span>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.currentTarget.value)}
              required
              id="name"
              type="text"
              placeholder={t('Role Name')}
              class="rounded-sm mt-2"
              disabled={props.disabled}
            />
          </div>
          <div>
            <span class="text-sm font-medium text-foreground">
              {t('Permissions')}
            </span>
            <div class="overflow-y-auto p-2 rounded-md">
              <ScrollArea class="h-[55vh] pr-4">
                <div class="grid grid-cols-2 gap-x-6">
                  <For each={initialPermissions}>
                    {(permission) => (
                      <div class="flex flex-col justify-between py-3 border-b last:border-b-0">
                        <div class="flex flex-row items-center justify-between gap-2">
                          <span class="font-semibold text-sm text-foreground">
                            {permission.name}
                          </span>
                          <div class="flex bg-accent rounded-sm">
                            <Show when={!permission.disableNone}>
                              <Button
                                class="h-9 px-4"
                                variant={getButtonVariant(
                                  permission.name,
                                  'None',
                                )}
                                onClick={() =>
                                  handlePermissionChange(
                                    permission.name,
                                    'None',
                                  )
                                }
                                disabled={props.disabled}
                              >
                                {t('None')}
                              </Button>
                            </Show>
                            <Show when={!permission.disableRead}>
                              <Button
                                class="h-9 px-4"
                                variant={getButtonVariant(
                                  permission.name,
                                  'Read',
                                )}
                                onClick={() =>
                                  handlePermissionChange(
                                    permission.name,
                                    'Read',
                                  )
                                }
                                disabled={props.disabled}
                              >
                                {t('Read')}
                              </Button>
                            </Show>
                            <Button
                              class="h-9 px-4"
                              variant={getButtonVariant(
                                permission.name,
                                'Write',
                              )}
                              onClick={() =>
                                handlePermissionChange(permission.name, 'Write')
                              }
                              disabled={props.disabled}
                            >
                              {t('Write')}
                            </Button>
                          </div>
                        </div>
                        <span class="text-xs text-muted-foreground mt-1">
                          {permission.description}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </ScrollArea>
            </div>
          </div>
          <Show when={!props.disabled}>
            <Button onClick={handleSubmit}>
              <Show when={props.mode === 'create'} fallback={t('Save')}>
                {t('Create')}
              </Show>
            </Button>
          </Show>
        </div>
      </DialogContent>
    </Dialog>
  );
};
