import { CustomAuthProperty } from '@activepieces/pieces-framework';

import { GenericPropertiesForm } from '@/app/builder/piece-properties/generic-properties-form';

type CustomAuthConnectionSettingsProps = {
  authProperty: CustomAuthProperty<any>;
};

const CustomAuthConnectionSettings = ({
  authProperty,
}: CustomAuthConnectionSettingsProps) => {
  return (
    <GenericPropertiesForm
      prefixValue="request.value.props"
      props={authProperty.props}
      useMentionTextInput={false}
      propertySettings={null}
      dynamicPropsInfo={null}
    />
  );
};

CustomAuthConnectionSettings.displayName = 'CustomAuthConnectionSettings';
export { CustomAuthConnectionSettings };
