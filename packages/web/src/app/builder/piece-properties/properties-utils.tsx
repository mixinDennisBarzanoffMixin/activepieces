import {
  PieceProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import { isNil, PropertySettings } from '@activepieces/shared';
import { t } from 'i18next';
import { Show } from 'solid-js';

import { BuilderField, BuilderForm } from '@/app/builder/builder-form';
import { ColorPicker } from '@/components/custom/color-picker';
import { DictionaryInput } from '@/components/custom/dictionary-input';
import { JsonEditor } from '@/components/custom/json-editor';
import { ApMarkdown } from '@/components/custom/markdown';
import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { FormControl } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { SecretInput } from '@/features/connections/components/secret-input';

import { ArrayPieceProperty } from './array-property';
import { AutoFormFieldWrapper } from './auto-form-field-wrapper';
import { BuilderJsonEditorWrapper } from './builder-json-wrapper';
import CustomProperty from './custom-property';
import { DynamicDropdownPieceProperty } from './dynamic-dropdown-piece-property';
import { DynamicProperties } from './dynamic-piece-property';
import { TextInputWithMentions } from './text-input-with-mentions';

export const selectGenericFormComponentForProperty = (
  props: SelectGenericFormComponentForPropertyParams,
) => {
  switch (props.property.type) {
    case PropertyType.ARRAY:
      return (
        <AutoFormFieldWrapper
          property={props.property}
          hideLabel={props.hideLabel}
          propertyName={props.propertyName}
          field={props.field}
          disabled={props.disabled}
          inputName={props.inputName}
          allowDynamicValues={props.allowDynamicValues}
          dynamicInputModeToggled={props.dynamicInputModeToggled}
        >
          <ArrayPieceProperty
            disabled={props.disabled}
            arrayProperty={props.property}
            inputName={props.inputName}
            useMentionTextInput={props.useMentionTextInput}
          />
        </AutoFormFieldWrapper>
      );
    case PropertyType.OBJECT:
      return (
        <AutoFormFieldWrapper
          property={props.property}
          propertyName={props.propertyName}
          field={props.field}
          hideLabel={props.hideLabel}
          inputName={props.inputName}
          disabled={props.disabled}
          allowDynamicValues={props.allowDynamicValues}
          dynamicInputModeToggled={props.dynamicInputModeToggled}
        >
          <DictionaryInput
            disabled={props.disabled}
            values={props.field.value}
            onChange={props.field.onChange}
            keyInputClassName={
              props.useMentionTextInput ? 'h-[38px]' : undefined
            }
            renderValueInput={
              props.useMentionTextInput
                ? (props) => (
                    <TextInputWithMentions
                      initialValue={props.value}
                      disabled={props.disabled}
                      onChange={props.onChange}
                    />
                  )
                : undefined
            }
          />
        </AutoFormFieldWrapper>
      );
    case PropertyType.CHECKBOX:
      return (
        <AutoFormFieldWrapper
          property={props.property}
          propertyName={props.propertyName}
          disabled={props.disabled}
          hideLabel={props.hideLabel}
          field={props.field}
          inputName={props.inputName}
          allowDynamicValues={props.allowDynamicValues}
          placeBeforeLabelText={true}
          dynamicInputModeToggled={props.dynamicInputModeToggled}
        >
          <FormControl>
            <Switch
              id={props.propertyName}
              checked={props.field.value}
              disabled={props.disabled}
              onCheckedChange={props.field.onChange}
            />
          </FormControl>
        </AutoFormFieldWrapper>
      );
    case PropertyType.MARKDOWN:
      return (
        <ApMarkdown
          markdown={props.property.description}
          variables={props.markdownVariables}
          variant={props.property.variant}
        />
      );
    case PropertyType.STATIC_DROPDOWN:
      return (
        <AutoFormFieldWrapper
          property={props.property}
          propertyName={props.propertyName}
          inputName={props.inputName}
          field={props.field}
          hideLabel={props.hideLabel}
          disabled={props.disabled}
          allowDynamicValues={props.allowDynamicValues}
          dynamicInputModeToggled={props.dynamicInputModeToggled}
        >
          <SearchableSelect
            options={props.property.options.options}
            onChange={props.field.onChange}
            value={props.field.value}
            disabled={props.disabled}
            placeholder={
              props.property.options.placeholder ?? t('Select an option')
            }
            showDeselect={!props.property.required}
          />
        </AutoFormFieldWrapper>
      );
    case PropertyType.JSON:
      return (
        <AutoFormFieldWrapper
          propertyName={props.propertyName}
          inputName={props.inputName}
          property={props.property}
          field={props.field}
          hideLabel={props.hideLabel}
          disabled={props.disabled}
          allowDynamicValues={props.allowDynamicValues}
          dynamicInputModeToggled={props.dynamicInputModeToggled}
        >
          <Show
            when={props.useMentionTextInput}
            fallback={
              <JsonEditor field={props.field} readonly={props.disabled} />
            }
          >
            <BuilderJsonEditorWrapper
              field={props.field}
              disabled={props.disabled}
            />
          </Show>
        </AutoFormFieldWrapper>
      );
    case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
      return (
        <AutoFormFieldWrapper
          property={props.property}
          inputName={props.inputName}
          propertyName={props.propertyName}
          field={props.field}
          hideLabel={props.hideLabel}
          disabled={props.disabled}
          allowDynamicValues={props.allowDynamicValues}
          dynamicInputModeToggled={props.dynamicInputModeToggled}
        >
          <MultiSelectPieceProperty
            placeholder={
              props.property.options.placeholder ?? t('Select an option')
            }
            options={props.property.options.options}
            onChange={props.field.onChange}
            initialValues={props.field.value}
            disabled={props.disabled}
            showDeselect={
              !isNil(props.field.value) &&
              props.field.value.length > 0 &&
              !props.property.required
            }
          />
        </AutoFormFieldWrapper>
      );
    case PropertyType.MULTI_SELECT_DROPDOWN:
    case PropertyType.DROPDOWN:
      return (
        <AutoFormFieldWrapper
          inputName={props.inputName}
          property={props.property}
          propertyName={props.propertyName}
          field={props.field}
          hideLabel={props.hideLabel}
          disabled={props.disabled}
          allowDynamicValues={props.allowDynamicValues}
          dynamicInputModeToggled={props.dynamicInputModeToggled}
        >
          <Show
            when={isNil(props.dynamicPropsInfo)}
            fallback={
              <DynamicDropdownPieceProperty
                refreshers={props.property.refreshers}
                value={props.field.value}
                actionOrTriggerName={props.dynamicPropsInfo.actionOrTriggerName}
                pieceName={props.dynamicPropsInfo.pieceName}
                pieceVersion={props.dynamicPropsInfo.pieceVersion}
                form={props.form}
                placedInside={props.dynamicPropsInfo.placedInside}
                onChange={props.field.onChange}
                disabled={props.disabled}
                propertyName={props.propertyName}
                multiple={
                  props.property.type === PropertyType.MULTI_SELECT_DROPDOWN
                }
                showDeselect={!props.property.required}
                shouldRefreshOnSearch={props.property.refreshOnSearch ?? false}
              />
            }
          >
            <div>Error: dynamicPropsInfo is required</div>
          </Show>
        </AutoFormFieldWrapper>
      );
    case PropertyType.DATE_TIME:
    case PropertyType.SHORT_TEXT:
    case PropertyType.LONG_TEXT:
    case PropertyType.FILE:
    case PropertyType.NUMBER:
    case PropertyType.SECRET_TEXT:
      return (
        <AutoFormFieldWrapper
          property={props.property}
          inputName={props.inputName}
          field={props.field}
          hideLabel={props.hideLabel}
          propertyName={props.propertyName}
          disabled={props.disabled}
          allowDynamicValues={false}
          dynamicInputModeToggled={props.dynamicInputModeToggled}
        >
          <Show
            when={props.useMentionTextInput}
            fallback={
              <SecretInput
                ref={props.field.ref}
                value={props.field.value}
                onChange={props.field.onChange}
                disabled={props.disabled}
                type={
                  props.property.type === PropertyType.SECRET_TEXT
                    ? 'password'
                    : 'text'
                }
              />
            }
          >
            <TextInputWithMentions
              disabled={props.disabled}
              initialValue={props.field.value}
              onChange={props.field.onChange}
              enableMarkdown={props.enableMarkdownForInputWithMention}
            />
          </Show>
        </AutoFormFieldWrapper>
      );
    case PropertyType.DYNAMIC:
      return props.dynamicPropsInfo ? (
        <DynamicProperties
          refreshers={props.property.refreshers}
          propertyName={props.propertyName}
          disabled={props.disabled}
          pieceName={props.dynamicPropsInfo.pieceName}
          pieceVersion={props.dynamicPropsInfo.pieceVersion}
          actionOrTriggerName={props.dynamicPropsInfo.actionOrTriggerName}
          placedInside={props.dynamicPropsInfo.placedInside}
          propertySettings={props.propertySettings}
          updateFormSchema={props.dynamicPropsInfo.updateFormSchema}
          updatePropertySettingsSchema={
            props.dynamicPropsInfo.updatePropertySettingsSchema
          }
        />
      ) : (
        <div>Error: dynamicPropsInfo is required</div>
      );
    case PropertyType.CUSTOM_AUTH:
    case PropertyType.BASIC_AUTH:
    case PropertyType.OAUTH2:
      return <></>;
    case PropertyType.CUSTOM:
      return (
        <CustomProperty
          code={props.property.code}
          value={props.field.value}
          onChange={props.field.onChange}
          disabled={props.disabled}
          property={props.property}
        />
      );
    case PropertyType.COLOR:
      return (
        <AutoFormFieldWrapper
          property={props.property}
          inputName={props.inputName}
          propertyName={props.propertyName}
          field={props.field}
          hideLabel={props.hideLabel}
          disabled={props.disabled}
          allowDynamicValues={props.allowDynamicValues}
          dynamicInputModeToggled={props.dynamicInputModeToggled}
        >
          <ColorPicker
            value={props.field.value}
            onChange={props.field.onChange}
          />
        </AutoFormFieldWrapper>
      );
  }
};

export type SelectGenericFormComponentForPropertyParams = {
  field: BuilderField;
  hideLabel?: boolean;
  propertyName: string;
  inputName: string;
  property: PieceProperty;
  allowDynamicValues: boolean;
  markdownVariables: Record<string, string>;
  useMentionTextInput: boolean;
  disabled: boolean;
  dynamicInputModeToggled: boolean;
  form: BuilderForm;
  propertySettings: Record<string, PropertySettings> | null;
  enableMarkdownForInputWithMention?: boolean;
  dynamicPropsInfo:
    | ({
        pieceName: string;
        pieceVersion: string;
        actionOrTriggerName: string;
      } & (
        | {
            placedInside: 'stepSettings';
            updateFormSchema: (
              key: string,
              newFieldSchema: PiecePropertyMap,
            ) => void;
            updatePropertySettingsSchema: (
              schema: PiecePropertyMap,
              propertyName: string,
              form: BuilderForm,
            ) => void;
          }
        | {
            placedInside: 'predefinedAgentInputs';
            updateFormSchema: null;
            updatePropertySettingsSchema: null;
          }
      ))
    | null;
};
