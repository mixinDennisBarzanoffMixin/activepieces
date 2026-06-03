import { PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2 } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type RoleConfig<T = string> = {
  value: T;
  label: string;
  description: string;
};

const PLATFORM_ROLES: RoleConfig<PlatformRole>[] = [
  {
    value: PlatformRole.ADMIN,
    label: t('Admin'),
    description: t('Full access to all projects and platform settings'),
  },
  {
    value: PlatformRole.OPERATOR,
    label: t('Operator'),
    description: t(
      'Access and edit flows in all projects, no platform settings',
    ),
  },
  {
    value: PlatformRole.MEMBER,
    label: t('Member'),
    description: t(
      "Access to personal project and any team projects they're invited to",
    ),
  },
];

const PROJECT_ROLE_DESCRIPTIONS: Record<string, string> = {
  Admin: t('Manage project settings, members, connections, and git sync'),
  Editor: t('Build, publish, and manage flows'),
  Viewer: t('View flows and monitor run history'),
};

export const getProjectRoleDescription = (roleName: string): string => {
  return PROJECT_ROLE_DESCRIPTIONS[roleName] || '';
};

interface RoleSelectorProps {
  type: 'platform' | 'project';
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  roles?: Array<{ name: string }>;
  isLoading?: boolean;
  isAssigningRole?: boolean;
}

export const RoleSelector = (_props: RoleSelectorProps) => {
  const isPlatform = () => _props.type === 'platform';
  const projectRolesLoading = () => !isPlatform() && !!_props.isLoading;
  const projectRoleAssigning = () => !isPlatform() && !!_props.isAssigningRole;
  const showProjectSpinner = () =>
    projectRolesLoading() || projectRoleAssigning();
  const selectDisabled = () => !!_props.disabled || showProjectSpinner();

  const label = () => (isPlatform() ? t('Platform Roles') : t('Project Roles'));

  const options = createMemo<RoleConfig[]>(() =>
    isPlatform()
      ? PLATFORM_ROLES.map((role) => ({
          value: role.value,
          label: role.label,
          description: role.description,
        }))
      : (_props.roles ?? []).map((role) => ({
          value: role.name,
          label: role.name,
          description: getProjectRoleDescription(role.name),
        })),
  );

  const selectedRole = createMemo(() =>
    options().find((r) => r.value === _props.value),
  );

  return (
    <Select
      value={_props.value}
      onValueChange={_props.onValueChange}
      disabled={selectDisabled()}
    >
      <SelectTrigger class="w-full">
        <Show
          when={showProjectSpinner()}
          fallback={
            selectedRole() ? (
              <span class="font-normal">{selectedRole()?.label}</span>
            ) : (
              <SelectValue
                placeholder={_props.placeholder || String(t('Select Role'))}
              />
            )
          }
        >
          <span class="flex items-center gap-2 font-normal text-muted-foreground">
            <Loader2 class="size-4 animate-spin" />
            {projectRoleAssigning() ? t('Saving...') : t('Loading...')}
          </span>
        </Show>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label()}</SelectLabel>
          <For each={options()}>
            {(option) => (
              <SelectItem key={option.value} value={option.value} class="py-3">
                <div class="flex flex-col gap-1">
                  <span class="font-medium">{t(option.label)}</span>
                  <span class="text-xs text-muted-foreground">
                    {t(option.description)}
                  </span>
                </div>
              </SelectItem>
            )}
          </For>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

interface RoleDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  roles: Array<{ name: string }>;
  className?: string;
}

export const RoleDropdown = (_props: RoleDropdownProps) => {
  return (
    <Select
      value={_props.value}
      onValueChange={_props.onValueChange}
      disabled={!!_props.disabled}
    >
      <SelectTrigger class={cn('w-[150px] justify-between', _props.className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{t('Roles')}</SelectLabel>
          <For each={_props.roles}>
            {(role) => (
              <SelectItem key={role.name} value={role.name} class="py-3">
                <div class="flex flex-col gap-1">
                  <span class="font-medium">{role.name}</span>
                  <span class="text-xs text-muted-foreground">
                    {t(getProjectRoleDescription(role.name))}
                  </span>
                </div>
              </SelectItem>
            )}
          </For>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
