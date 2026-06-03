import {
  ArrayProperty,
  ArraySubProps,
  PropertyType,
} from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { Plus, TrashIcon } from 'lucide-solid';
import { nanoid } from 'nanoid';
import { For, Show, createEffect, createSignal } from 'solid-js';

import { useFormContext } from '@/app/builder/builder-form';
import { ArrayInput } from '@/components/custom/array-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';

import { GenericPropertiesForm } from './generic-properties-form';
import { TextInputWithMentions } from './text-input-with-mentions';

type ArrayPropertyProps = {
  inputName: string;
  useMentionTextInput: boolean;
  arrayProperty: ArrayProperty<boolean>;
  disabled: boolean;
};

type ArrayField = {
  id: string;
  value: unknown;
};

const getFields = (value: unknown): ArrayField[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const items: unknown[] = value;
  return items.map((item) => ({
    id: nanoid(),
    value: item,
  }));
};

const getDefaultValuesForInputs = (arrayProperties: ArraySubProps<boolean>) => {
  return Object.entries(arrayProperties).reduce((acc, [key, value]) => {
    const property = value as { type: PropertyType };
    switch (property.type) {
      case PropertyType.LONG_TEXT:
      case PropertyType.SHORT_TEXT:
      case PropertyType.NUMBER:
      case PropertyType.JSON:
      case PropertyType.COLOR:
        return {
          ...acc,
          [key]: '',
        };
      case PropertyType.CHECKBOX:
        return {
          ...acc,
          [key]: false,
        };
      case PropertyType.STATIC_DROPDOWN:
      case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
      case PropertyType.MULTI_SELECT_DROPDOWN:
      case PropertyType.DATE_TIME:
        return {
          ...acc,
          [key]: null,
        };
      case PropertyType.FILE:
        return {
          ...acc,
          [key]: null,
        };
    }
  }, {} as Record<string, unknown>);
};
const ArrayPieceProperty = (props: ArrayPropertyProps) => {
  const form = useFormContext();
  const properties = () =>
    props.arrayProperty.properties() as ArraySubProps<boolean> | undefined;

  const [fields, setFields] = createSignal<ArrayField[]>([]);

  createEffect(() => {
    setFields(getFields(form.getValues(props.inputName)));
  });

  const updateFormValue = (newFields: ArrayField[]) => {
    form.setValue(
      props.inputName,
      newFields.map((f) => f.value),
      { shouldValidate: true },
    );
  };

  const append = () => {
    //passing empty object will result in react form putting in the initial values when the user first started editing
    const current = properties();
    const value = current ? getDefaultValuesForInputs(current) : '';
    const formValues = getFields(form.getValues(props.inputName));
    const newFields = [...formValues, { id: nanoid(), value }];

    setFields(newFields);
    updateFormValue(newFields);
  };

  const remove = (index: number) => {
    const currentFields = getFields(form.getValues(props.inputName));
    const newFields = currentFields.filter((_, i) => i !== index);
    setFields(newFields);
    updateFormValue(newFields);
  };

  return (
    <>
      <Show when={properties()}>
        {(properties) => (
          <div class={cn('flex w-full flex-col', GAP_SIZE_FOR_STEP_SETTINGS)}>
            <For each={fields}>
              {(field, index) => (
                <div
                  class={cn(
                    'p-4 border rounded-md flex flex-col',
                    GAP_SIZE_FOR_STEP_SETTINGS,
                  )}
                >
                  <div class="flex justify-between">
                    <div class="font-semibold"> #{index() + 1}</div>
                    <Button
                      variant="outline"
                      size="icon"
                      class="size-8 shrink-0"
                      onClick={() => {
                        remove(index());
                      }}
                      disabled={props.disabled}
                    >
                      <TrashIcon
                        class="size-4 text-destructive"
                        aria-hidden="true"
                      />
                      <span class="sr-only">{t('Remove')}</span>
                    </Button>
                  </div>
                  <GenericPropertiesForm
                    prefixValue={`${props.inputName}.[${index()}]`}
                    props={properties()}
                    useMentionTextInput={props.useMentionTextInput}
                    propertySettings={null}
                    dynamicPropsInfo={null}
                    disabled={props.disabled}
                    onValueChange={() => {
                      void form.trigger(props.inputName);
                    }}
                  />
                </div>
              )}
            </For>
            <Show when={!props.disabled}>
              <Button
                variant="outline"
                size="sm"
                class="mt-2"
                onClick={() => {
                  append();
                }}
                type="button"
              >
                <div class="flex items-center gap-2">
                  <Plus size={18} />
                  {t('Add Item')}
                </div>
              </Button>
            </Show>
          </div>
        )}
      </Show>

      <Show when={!props.arrayProperty.properties()}>
        <ArrayInput
          inputName={props.inputName}
          disabled={props.disabled}
          required={props.arrayProperty.required}
          customInputNode={(onChange, value, disabled) => {
            if (!props.useMentionTextInput) {
              return (
                <Input
                  value={value}
                  onChange={(e) => onChange(e.currentTarget.value)}
                  disabled={disabled}
                />
              );
            }
            return (
              <TextInputWithMentions
                initialValue={value}
                onChange={(newValue) => onChange(newValue)}
                disabled={disabled}
              />
            );
          }}
        />
      </Show>
    </>
  );
};

export { ArrayPieceProperty };
