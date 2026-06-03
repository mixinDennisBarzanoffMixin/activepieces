import { BasicAuthProperty } from '@activepieces/pieces-framework';

import { Label } from '@/components/ui/label';

import { SolidConnectionForm } from './connection-form';
import { SecretInput } from './secret-input';

type BasicAuthConnectionSettingsProps = {
  authProperty: BasicAuthProperty;
  form: SolidConnectionForm<unknown>;
};

const BasicAuthConnectionSettings = (
  props: BasicAuthConnectionSettingsProps,
) => {
  return (
    <>
      <div class="flex flex-col">
        <Label showRequiredIndicator>
          {props.authProperty.username.displayName}
        </Label>
        <SecretInput
          value={String(props.form.getValue('request.value.username') ?? '')}
          onInput={(value) =>
            props.form.setValue('request.value.username', value)
          }
          type="text"
        />
        <p class="text-sm text-muted-foreground">
          {props.authProperty.username.description}
        </p>
      </div>
      <div class="flex flex-col mt-3.5">
        <Label showRequiredIndicator>
          {props.authProperty.password.displayName}
        </Label>
        <SecretInput
          value={String(props.form.getValue('request.value.password') ?? '')}
          onInput={(value) =>
            props.form.setValue('request.value.password', value)
          }
          type="password"
        />
        <p class="text-sm text-muted-foreground">
          {props.authProperty.password.description}
        </p>
      </div>
    </>
  );
};

export { BasicAuthConnectionSettings };
