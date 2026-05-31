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
import { Show, ErrorBoundary } from 'solid-js';
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

function AutoFormFieldWrapper({
  placeBeforeLabelText = false,
  hideLabel,
  children,
  allowDynamicValues,
  propertyName,
  inputName,
  property,
  disabled,
  field,
  dynamicInputModeToggled,
  //we have to pass this prop, because props inside custom auth can be secret text, which means their labels will become (Connection)
  isForConnectionSelect = false,
}: AutoFormFieldWrapperProps) {
  const isArrayProperty =
    !isPieceAuthProperty(property) && property.type === PropertyType.ARRAY;
  const isAuthProperty = isForConnectionSelect || Array.isArray(property);
  return (
    <AutoFormFielWrapperErrorBoundary
      field={field}
      property={property ?? null}
      dynamicInputModeToggled={dynamicInputModeToggled}
    >
      <FormItem class="flex flex-col">
        <Show when={(!hideLabel || placeBeforeLabelText)()}>
          <FormLabel class="flex items-center gap-1 h-7.5 max-h-7.5">
            <Show when={placeBeforeLabelText && !dynamicInputModeToggled()}>
              {children}
            </Show>
            <div className="pt-1">
              <span>
                <Show when={isAuthProperty()} fallback={property.displayName}>
                  {t('Connection')}
                </Show>
              </span>{' '}
              <Show when={(isAuthProperty || property.required)()}>
                <RequiredFieldAsterisk />
              </Show>
            </div>
            <Show when={property && !isAuthProperty()}>
              <PropertyTypeTooltip property={property} />
            </Show>

            <span className="grow"></span>
            <Show when={allowDynamicValues()}>
              <DynamicValueToggle
                propertyName={propertyName}
                inputName={inputName}
                property={property}
                disabled={disabled}
                isToggled={dynamicInputModeToggled ?? false}
              />
            </Show>
          </FormLabel>
        </Show>
        <Show when={dynamicInputModeToggled && !isArrayProperty()}>
          <TextInputWithMentions
            disabled={disabled}
            onChange={field.onChange}
            initialValue={field.value ?? null}
          />
        </Show>

        <Show when={isArrayProperty && dynamicInputModeToggled()}>
          <ArrayPiecePropertyInInlineItemMode
            disabled={disabled}
            arrayProperties={property.properties}
            inputName={inputName}
            onChange={field.onChange}
            value={field.value ?? null}
          />
        </Show>

        <Show when={!placeBeforeLabelText && !dynamicInputModeToggled()}>
          <div>{children}</div>
        </Show>
        <Show
          when={
            !isForConnectionSelect &&
            !Array.isArray(property) &&
            property.description()
          }
        >
          <ReadMoreDescription text={property.description} />
        </Show>
      </FormItem>
    </AutoFormFielWrapperErrorBoundary>
  );
}

function AutoFormFielWrapperErrorBoundary({
  children,
  field,
  property,
  dynamicInputModeToggled,
}: AutoFormFielWrapperErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallbackRender={() => (
        <div className="text-sm  flex items-center justify-between">
          <div className="text-destructive">
            {t('input value is invalid, please contact support')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(
                JSON.stringify({
                  stringifiedValue: stringifyValue(field.value),
                  property,
                  dynamicInputModeToggled,
                  disabled: field.disabled,
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
      {children}
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

function DynamicValueToggle({
  propertyName,
  inputName,
  property,
  disabled,
  isToggled,
}: DynamicValueToggleProps) {
  const form = useFormContext<FlowAction | FlowTrigger>();
  function updatePropertySettings(mode: PropertyExecutionType) {
    const propertySettingsForSingleProperty = {
      ...form.getValues().settings?.propertySettings?.[propertyName],
      type: mode,
    };
    form.setValue(
      `settings.propertySettings.${propertyName}`,
      propertySettingsForSingleProperty,
      {
        shouldValidate: true,
      },
    );
  }
  function handleDynamicValueToggleChange(mode: PropertyExecutionType) {
    updatePropertySettings(mode);
    if (isInputNameLiteral(inputName)) {
      const currentValue = form.getValues(inputName);
      const newValue = getValueForInputOnDynamicToggleChange(
        property,
        mode,
        currentValue,
      );
      form.setValue(inputName, newValue, {
        shouldValidate: true,
      });
    } else {
      throw new Error(
        'inputName is not a member of step settings input, you might be using dynamic properties where you should not',
      );
    }
  }
  return (
    <div className="flex gap-2 items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={isToggled}
            onPressedChange={(newIsToggled) =>
              handleDynamicValueToggleChange(
                newIsToggled
                  ? PropertyExecutionType.DYNAMIC
                  : PropertyExecutionType.MANUAL,
              )
            }
            disabled={disabled}
            size="sm"
          >
            <SquareFunction
              class={cn('size-5', {
                'text-foreground': isToggled,
                'text-muted-foreground': !isToggled,
              })}
            />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="top">{t('Dynamic value')}</TooltipContent>
      </Tooltip>
    </div>
  );
}
function PropertyTypeTooltip({ property }: { property: PieceProperty }) {
  if (
    property.type !== PropertyType.FILE &&
    property.type !== PropertyType.DATE_TIME
  ) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Show
          when={property.type === PropertyType.FILE()}
          fallback={
            property.type === PropertyType.DATE_TIME && (
              <Calendar class="w-4 h-4 stroke-foreground/55"></Calendar>
            )
          }
        >
          <File class="w-4 h-4 stroke-foreground/55"></File>
        </Show>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <>
          <Show when={property.type === PropertyType.FILE()}>
            {t('File Input i.e a url or file passed from a previous step')}
          </Show>
          <Show when={property.type === PropertyType.DATE_TIME()}>
            {t('Date Input must comply with ISO 8601 format')}
          </Show>
        </>
      </TooltipContent>
    </Tooltip>
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

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };

type DynamicValueToggleProps = {
  propertyName: string;
  inputName: string;
  property: PieceProperty | PieceAuthProperty[];
  disabled: boolean;
  isToggled: boolean;
};

type AutoFormFieldWrapperProps = {
  children: any;
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
  children: any;
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
