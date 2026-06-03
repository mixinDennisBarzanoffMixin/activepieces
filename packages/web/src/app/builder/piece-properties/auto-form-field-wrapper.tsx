import {
  PieceAuthProperty,
  PieceProperty,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  FlowAction,
  FlowTrigger,
  PropertyExecutionType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Calendar, SquareFunction, File } from 'lucide-solid';
import { Show, ErrorBoundary, mergeProps, JSX } from 'solid-js';
import { toast } from 'solid-sonner';

import { BuilderField, useFormContext } from '@/app/builder/builder-form';
import { ReadMoreDescription } from '@/components/custom/read-more-description';
import { Button } from '@/components/ui/button';
import { FormItem, FormLabel } from '@/components/ui/form';
import { RequiredFieldAsterisk } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formUtils } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { ArrayPiecePropertyInInlineItemMode } from './array-property-in-inline-item-mode';
import { TextInputWithMentions } from './text-input-with-mentions';

function AutoFormFieldWrapper(_props: AutoFormFieldWrapperProps) {
  const props = mergeProps(
    { placeBeforeLabelText: false, isForConnectionSelect: false },
    _props,
  );
  const isArrayProperty = () =>
    !isPieceAuthProperty(props.property) &&
    props.property.type === PropertyType.ARRAY;
  const isAuthProperty = () =>
    props.isForConnectionSelect || Array.isArray(props.property);
  const label = () => {
    if (isAuthProperty() || Array.isArray(props.property)) {
      return t('Connection');
    }
    return props.property.displayName;
  };
  const isRequired = () => {
    if (isAuthProperty() || Array.isArray(props.property)) {
      return true;
    }
    return props.property.required;
  };
  const description = () =>
    !props.isForConnectionSelect &&
    !Array.isArray(props.property) &&
    props.property.description
      ? props.property.description
      : undefined;
  const arrayProperties = () => {
    if (
      !isPieceAuthProperty(props.property) &&
      props.property.type === PropertyType.ARRAY
    ) {
      return props.property.properties;
    }
    return undefined;
  };
  const propertyForTooltip = () => {
    if (isAuthProperty() || Array.isArray(props.property)) {
      return undefined;
    }
    return props.property;
  };
  return (
    <AutoFormFielWrapperErrorBoundary
      field={props.field}
      property={props.property ?? null}
      dynamicInputModeToggled={props.dynamicInputModeToggled}
    >
      <FormItem class="flex flex-col">
        <Show when={!props.hideLabel || props.placeBeforeLabelText}>
          <FormLabel class="flex items-center gap-1 h-7.5 max-h-7.5">
            <Show
              when={
                props.placeBeforeLabelText && !props.dynamicInputModeToggled
              }
            >
              {props.children}
            </Show>
            <div class="pt-1">
              <span>
                <Show when={isAuthProperty()} fallback={label()}>
                  {t('Connection')}
                </Show>
              </span>{' '}
              <Show when={isRequired()}>
                <RequiredFieldAsterisk />
              </Show>
            </div>
            <Show when={propertyForTooltip()}>
              {(property) => <PropertyTypeTooltip property={property()} />}
            </Show>

            <span class="grow" />
            <Show when={props.allowDynamicValues}>
              <DynamicValueToggle
                propertyName={props.propertyName}
                inputName={props.inputName}
                property={props.property}
                disabled={props.disabled}
                isToggled={props.dynamicInputModeToggled ?? false}
              />
            </Show>
          </FormLabel>
        </Show>
        <Show when={props.dynamicInputModeToggled && !isArrayProperty()}>
          <TextInputWithMentions
            disabled={props.disabled}
            onChange={props.field.onChange}
            initialValue={props.field.value ?? null}
          />
        </Show>

        <Show when={isArrayProperty() && props.dynamicInputModeToggled}>
          <ArrayPiecePropertyInInlineItemMode
            disabled={props.disabled}
            arrayProperties={arrayProperties()}
            inputName={props.inputName}
            onChange={props.field.onChange}
            value={props.field.value ?? null}
          />
        </Show>

        <Show
          when={!props.placeBeforeLabelText && !props.dynamicInputModeToggled}
        >
          <div>{props.children}</div>
        </Show>
        <Show when={description()}>
          {(text) => <ReadMoreDescription text={text()} />}
        </Show>
      </FormItem>
    </AutoFormFielWrapperErrorBoundary>
  );
}

function AutoFormFielWrapperErrorBoundary(
  props: AutoFormFielWrapperErrorBoundaryProps,
) {
  return (
    <ErrorBoundary
      fallbackRender={() => (
        <div class="text-sm  flex items-center justify-between">
          <div class="text-destructive">
            {t('input value is invalid, please contact support')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(
                JSON.stringify({
                  stringifiedValue: stringifyValue(props.field.value),
                  property: props.property,
                  dynamicInputModeToggled: props.dynamicInputModeToggled,
                  disabled: props.field.disabled,
                }),
              );
              toast(t('Info copied to clipboard, please send it to support'), {
                duration: 3000,
              });
            }}
          >
            {t('Info')}
          </Button>
        </div>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
}

function getValueForInputOnDynamicToggleChange(
  property: PieceProperty | PieceAuthProperty[],
  newMode: PropertyExecutionType,
  currentValue: unknown,
) {
  const isAuthProperty = isPieceAuthProperty(property);
  switch (newMode) {
    case PropertyExecutionType.DYNAMIC: {
      if (!isAuthProperty && property.type === PropertyType.ARRAY) {
        return formUtils.getDefaultPropertyValue({
          property,
          dynamicInputModeToggled: true,
        });
      }
      //to show what the selected value is for dropdowns
      if (
        typeof currentValue === 'string' ||
        typeof currentValue === 'number'
      ) {
        return currentValue;
      }
      return JSON.stringify(currentValue);
    }
    case PropertyExecutionType.MANUAL:
      if (isAuthProperty) {
        return '';
      }
      return formUtils.getDefaultPropertyValue({
        property,
        dynamicInputModeToggled: false,
      });
  }
}

function DynamicValueToggle(props: DynamicValueToggleProps) {
  const form = useFormContext<FlowAction | FlowTrigger>();
  function updatePropertySettings(mode: PropertyExecutionType) {
    const propertySettingsForSingleProperty = {
      ...getPropertySettings(form.getValues(), props.propertyName),
      type: mode,
    };
    form.setValue(
      `settings.propertySettings.${props.propertyName}`,
      propertySettingsForSingleProperty,
      {
        shouldValidate: true,
      },
    );
  }
  function handleDynamicValueToggleChange(mode: PropertyExecutionType) {
    updatePropertySettings(mode);
    if (isInputNameLiteral(props.inputName)) {
      const currentValue: unknown = form.getValues(props.inputName);
      const newValue = getValueForInputOnDynamicToggleChange(
        props.property,
        mode,
        currentValue,
      );
      form.setValue(props.inputName, newValue, {
        shouldValidate: true,
      });
    } else {
      throw new Error(
        'inputName is not a member of step settings input, you might be using dynamic properties where you should not',
      );
    }
  }
  return (
    <div class="flex gap-2 items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={props.isToggled}
            onPressedChange={(newIsToggled) =>
              handleDynamicValueToggleChange(
                newIsToggled
                  ? PropertyExecutionType.DYNAMIC
                  : PropertyExecutionType.MANUAL,
              )
            }
            disabled={props.disabled}
            size="sm"
          >
            <SquareFunction
              class={cn('size-5', {
                'text-foreground': props.isToggled,
                'text-muted-foreground': !props.isToggled,
              })}
            />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="top">{t('Dynamic value')}</TooltipContent>
      </Tooltip>
    </div>
  );
}
function PropertyTypeTooltip(props: { property: PieceProperty }) {
  return (
    <Show
      when={
        props.property.type === PropertyType.FILE ||
        props.property.type === PropertyType.DATE_TIME
      }
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Show
            when={props.property.type === PropertyType.FILE}
            fallback={
              props.property.type === PropertyType.DATE_TIME && (
                <Calendar class="w-4 h-4 stroke-foreground/55" />
              )
            }
          >
            <File class="w-4 h-4 stroke-foreground/55" />
          </Show>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <>
            <Show when={props.property.type === PropertyType.FILE}>
              {t('File Input i.e a url or file passed from a previous step')}
            </Show>
            <Show when={props.property.type === PropertyType.DATE_TIME}>
              {t('Date Input must comply with ISO 8601 format')}
            </Show>
          </>
        </TooltipContent>
      </Tooltip>
    </Show>
  );
}
function stringifyValue(value: unknown) {
  try {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    return JSON.stringify(value);
  } catch (e) {
    return value;
  }
}

export { AutoFormFieldWrapper };

type DynamicValueToggleProps = {
  propertyName: string;
  inputName: string;
  property: PieceProperty | PieceAuthProperty[];
  disabled: boolean;
  isToggled: boolean;
};

type AutoFormFieldWrapperProps = {
  children: JSX.Element;
  hideLabel?: boolean;
  allowDynamicValues: boolean;
  propertyName: string;
  placeBeforeLabelText?: boolean;
  disabled: boolean;
  field: BuilderField;
  inputName: string;
  dynamicInputModeToggled?: boolean;
  property: PieceProperty | PieceAuthProperty[];
  isForConnectionSelect?: boolean;
};
type AutoFormFielWrapperErrorBoundaryProps = {
  children: JSX.Element;
  field: BuilderField;
  property: PieceProperty | PieceAuthProperty[] | null;
  dynamicInputModeToggled?: boolean;
};
function isInputNameLiteral(
  inputName: string,
): inputName is `settings.input.${string}` {
  return inputName.match(/settings\.input\./) !== null;
}
function isPieceAuthProperty(
  property: PieceProperty | PieceAuthProperty[],
): property is PieceAuthProperty[] {
  const authPropertyTypes = [
    PropertyType.SECRET_TEXT,
    PropertyType.BASIC_AUTH,
    PropertyType.OAUTH2,
    PropertyType.CUSTOM_AUTH,
  ];
  return (
    Array.isArray(property) ||
    authPropertyTypes.some((authType) => property.type === authType)
  );
}

function getPropertySettings(value: unknown, propertyName: string) {
  if (!value || typeof value !== 'object' || !('settings' in value)) {
    return {};
  }
  const settings = value.settings;
  if (
    !settings ||
    typeof settings !== 'object' ||
    !('propertySettings' in settings)
  ) {
    return {};
  }
  const properties = settings.propertySettings;
  if (!properties || typeof properties !== 'object') {
    return {};
  }
  const property = (properties as Record<string, unknown>)[propertyName];
  if (!property || typeof property !== 'object') {
    return {};
  }
  return property;
}
