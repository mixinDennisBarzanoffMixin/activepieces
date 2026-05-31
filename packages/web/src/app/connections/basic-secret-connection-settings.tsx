import { BasicAuthProperty } from '@activepieces/pieces-framework';

import { Label } from '@/components/ui/label';

import { SolidConnectionForm } from './connection-form';
import { SecretInput } from './secret-input';

type BasicAuthConnectionSettingsProps = {
  authProperty: BasicAuthProperty;
  form: SolidConnectionForm<unknown>;
};

const BasicAuthConnectionSettings = ({
  authProperty,
  form,
}: BasicAuthConnectionSettingsProps) => {
  return (
    <>
      <div class="flex flex-col">
        <Label showRequiredIndicator>{authProperty.username.displayName}</Label>
        <SecretInput
          value={String(form.getValue('request.value.username') ?? '')}
          onChange={(value) => form.setValue('request.value.username', value)}
          type="text"
        />
        <p class="text-sm text-muted-foreground">
          {authProperty.username.description}
        </p>
      </div>
      <div class="flex flex-col mt-3.5">
        <Label showRequiredIndicator>{authProperty.password.displayName}</Label>
        <SecretInput
          value={String(form.getValue('request.value.password') ?? '')}
          onChange={(value) => form.setValue('request.value.password', value)}
          type="password"
        />
        <p class="text-sm text-muted-foreground">
          {authProperty.password.description}
        </p>
      </div>
    </>
  );
};

BasicAuthConnectionSettings.displayName = 'BasicAuthConnectionSettings';
export { BasicAuthConnectionSettings };
