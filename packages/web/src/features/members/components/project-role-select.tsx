import { isNil } from '@activepieces/shared';
import { createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createEffect } from 'solid-js';

import { FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RoleSelector } from '@/features/members/components/role-selector';
import { projectRoleApi } from '@/features/platform-admin/api/project-role-api';
import { platformHooks } from '@/hooks/platform-hooks';

export const ProjectRoleSelect = ({ value, onChange }: ProjectRoleSelectProps) => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data: rolesData, isPending: rolesLoading } = createQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
    enabled:
      !isNil(platform.plan.projectRolesEnabled) &&
      platform.plan.projectRolesEnabled,
  });

  const roles = rolesData?.data ?? [];
  const defaultProjectRole =
    roles?.find((role) => role.name === 'Editor')?.name || roles?.[0]?.name;

  createEffect(() => {
    if (roles.length > 0 && defaultProjectRole) {
      if (!value) {
        onChange(defaultProjectRole);
      }
    }
  }, [roles.length, defaultProjectRole, value, onChange]);

  return (
    <FormItem class="grid gap-3">
      <Label>{t('Project Role')}</Label>
      <RoleSelector
        type="project"
        value={value || defaultProjectRole}
        onValueChange={onChange}
        roles={roles}
        placeholder={t('Select a project role')}
        isLoading={rolesLoading}
      />
      <FormMessage />
    </FormItem>
  );
};

type ProjectRoleSelectProps = {
  value: string | undefined;
  onChange: (value: string) => void;
};
