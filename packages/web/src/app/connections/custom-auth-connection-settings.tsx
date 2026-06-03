import {
  CustomAuthProperty,
  CustomAuthProps,
} from '@activepieces/pieces-framework';

import { GenericPropertiesForm } from '@/app/builder/piece-properties/generic-properties-form';

type CustomAuthConnectionSettingsProps = {
  authProperty: CustomAuthProperty<CustomAuthProps>;
};

const CustomAuthConnectionSettings = (
  props: CustomAuthConnectionSettingsProps,
) => {
  return (
    <GenericPropertiesForm
      prefixValue="request.value.props"
      props={props.authProperty.props}
      useMentionTextInput={false}
      propertySettings={null}
      dynamicPropsInfo={null}
    />
  );
};

export { CustomAuthConnectionSettings };
