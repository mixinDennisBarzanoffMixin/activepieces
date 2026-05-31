import { SecretTextProperty } from '@activepieces/pieces-framework';

import { Label } from '@/components/ui/label';

import { SolidConnectionForm } from './connection-form';
import { SecretInput } from './secret-input';

type SecretTextConnectionSettingsProps = {
  authProperty: SecretTextProperty<boolean>;
  form: SolidConnectionForm<unknown>;
};

const SecretTextConnectionSettings = ({
  authProperty,
  form,
}: SecretTextConnectionSettingsProps) => {
  return (
    <div class="flex flex-col gap-2">
      <Label showRequiredIndicator>{authProperty.displayName}</Label>
      <SecretInput
        value={String(form.getValue('request.value.secret_text') ?? '')}
        onChange={(value) => form.setValue('request.value.secret_text', value)}
        type="password"
      />
    </div>
  );
};

SecretTextConnectionSettings.displayName = 'SecretTextConnectionSettings';
export { SecretTextConnectionSettings };
