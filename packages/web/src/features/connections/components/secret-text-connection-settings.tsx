import { SecretTextProperty } from '@activepieces/pieces-framework';

import { Label } from '@/components/ui/label';

import { SolidConnectionForm } from './connection-form';
import { SecretInput } from './secret-input';

type SecretTextConnectionSettingsProps = {
  authProperty: SecretTextProperty<boolean>;
  form: SolidConnectionForm<unknown>;
};

const SecretTextConnectionSettings = (
  props: SecretTextConnectionSettingsProps,
) => {
  return (
    <div class="flex flex-col gap-2">
      <Label showRequiredIndicator>{props.authProperty.displayName}</Label>
      <SecretInput
        value={String(props.form.getValue('request.value.secret_text') ?? '')}
        onInput={(value) =>
          props.form.setValue('request.value.secret_text', value)
        }
        type="password"
      />
    </div>
  );
};

export { SecretTextConnectionSettings };
