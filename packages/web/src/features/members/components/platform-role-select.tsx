import { t } from 'i18next';

import { FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RoleSelector } from '@/features/members/components/role-selector';

export const PlatformRoleSelect = ({ value, onChange }: PlatformRoleSelectProps) => {
  return (
    <FormItem class="grid gap-3">
      <Label>{t('Platform Role')}</Label>
      <RoleSelector
        type="platform"
        value={value}
        onValueChange={onChange}
        placeholder={t('Select a platform role')}
      />
      <FormMessage />
    </FormItem>
  );
};

type PlatformRoleSelectProps = {
  value: string | undefined;
  onChange: (value: string) => void;
};
