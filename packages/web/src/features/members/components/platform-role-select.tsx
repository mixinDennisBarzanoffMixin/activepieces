import { t } from 'i18next';

import { FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RoleSelector } from '@/features/members/components/role-selector';

export const PlatformRoleSelect = (props: PlatformRoleSelectProps) => {
  return (
    <FormItem class="grid gap-3">
      <Label>{t('Platform Role')}</Label>
      <RoleSelector
        type="platform"
        value={props.value}
        onValueChange={props.onInput}
        placeholder={t('Select a platform role')}
      />
      <FormMessage />
    </FormItem>
  );
};

type PlatformRoleSelectProps = {
  value: string | undefined;
  onInput: (value: string) => void;
};
