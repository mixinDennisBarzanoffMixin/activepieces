import { isNil } from '@activepieces/shared';
import { createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createEffect, createMemo } from 'solid-js';

import { FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RoleSelector } from '@/features/members/components/role-selector';
import { projectRoleApi } from '@/features/platform-admin/api/project-role-api';
import { platformHooks } from '@/hooks/platform-hooks';

export const ProjectRoleSelect = (props: ProjectRoleSelectProps) => {
  const { platform } = platformHooks.useCurrentPlatform();

  const query = createQuery(() => ({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
    enabled:
      !isNil(platform.plan.projectRolesEnabled) &&
      platform.plan.projectRolesEnabled,
  }));

  const roles = createMemo(() => query.data?.data ?? []);
  const defaultProjectRole = createMemo(
    () =>
      roles().find((role) => role.name === 'Editor')?.name || roles()[0]?.name,
  );

  createEffect(() => {
    if (roles().length > 0 && defaultProjectRole()) {
      if (!props.value) {
        props.onInput(defaultProjectRole());
      }
    }
  });

  return (
    <FormItem class="grid gap-3">
      <Label>{t('Project Role')}</Label>
      <RoleSelector
        type="project"
        value={props.value || defaultProjectRole() || ''}
        onValueChange={props.onInput}
        roles={roles()}
        placeholder={t('Select a project role')}
        isLoading={query.isPending}
      />
      <FormMessage />
    </FormItem>
  );
};

type ProjectRoleSelectProps = {
  value: string | undefined;
  onInput: (value: string) => void;
};
