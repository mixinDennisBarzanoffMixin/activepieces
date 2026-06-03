import {
  OAuth2Props,
  PiecePropertyMap,
  ArraySubProps,
} from '@activepieces/pieces-framework';
import {
  isNil,
  PropertyExecutionType,
  PropertySettings,
} from '@activepieces/shared';
import { For, Show } from 'solid-js';

import { BuilderField, useFormContext } from '@/app/builder/builder-form';
import { FormField } from '@/components/ui/form';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';

import {
  selectGenericFormComponentForProperty,
  SelectGenericFormComponentForPropertyParams,
} from './properties-utils';

export const GenericPropertiesForm = (props: GenericPropertiesFormProps) => {
  const form = useFormContext();
  return (
    <Show when={Object.keys(props.props).length > 0}>
      <div class={cn('flex flex-col', GAP_SIZE_FOR_STEP_SETTINGS)}>
        <For each={Object.entries(props.props)}>
          {([propertyName]) => {
            const dynamicInputModeToggled =
              props.propertySettings?.[propertyName]?.type ===
              PropertyExecutionType.DYNAMIC;
            return (
              <FormField
                key={propertyName}
                name={
                  props.prefixValue.length > 0
                    ? `${props.prefixValue}.${propertyName}`
                    : propertyName
                }
                control={form.control}
                render={({ field }: { field: BuilderField }) => {
                  const controlled = {
                    ...field,
                    onChange: (value) => {
                      field.onChange(value);
                      props.onValueChange?.({
                        value,
                        propertyName,
                      });
                    },
                  };
                  return selectGenericFormComponentForProperty({
                    field: controlled,
                    propertyName,
                    inputName:
                      props.prefixValue.length > 0
                        ? `${props.prefixValue}.${propertyName}`
                        : propertyName,
                    property: props.props[propertyName],
                    allowDynamicValues: !isNil(props.propertySettings),
                    markdownVariables: props.markdownVariables ?? {},
                    useMentionTextInput: props.useMentionTextInput,
                    disabled: props.disabled ?? false,
                    dynamicInputModeToggled,
                    form,
                    dynamicPropsInfo: props.dynamicPropsInfo,
                    propertySettings: props.propertySettings,
                  });
                }}
              />
            );
          }}
        </For>
      </div>
    </Show>
  );
};

type GenericPropertiesFormProps = {
  props: PiecePropertyMap | OAuth2Props | ArraySubProps<boolean>;
  /**Use this to allow user toggling property execution type */
  propertySettings: Record<string, PropertySettings> | null;
  prefixValue: string;
  markdownVariables?: Record<string, string>;
  useMentionTextInput: boolean;
  disabled?: boolean;
  onValueChange?: (val: { value: unknown; propertyName: string }) => void;
  /**for dynamic dropdowns and dynamic properties */
  dynamicPropsInfo: SelectGenericFormComponentForPropertyParams['dynamicPropsInfo'];
};
