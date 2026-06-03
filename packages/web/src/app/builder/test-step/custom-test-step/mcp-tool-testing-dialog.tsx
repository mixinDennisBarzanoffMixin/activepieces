import {
  PropertyType,
  PiecePropertyMap,
  PieceProperty,
} from '@activepieces/pieces-framework';
import { McpPropertyType } from '@activepieces/shared';
import { t } from 'i18next';
import { For, Show } from 'solid-js';

import { createForm, useFormContext } from '@/app/builder/builder-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';

import { GenericPropertiesForm } from '../../piece-properties/generic-properties-form';
import { testStepHooks } from '../utils/test-step-hooks';

type McpToolTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestingSuccess: () => void;
};

interface McpFormField {
  name: string;
  description?: string;
  required: boolean;
  type: McpPropertyType;
  defaultValue?: unknown;
}
function mapMcpTypeToPropertyType(mcpType: McpPropertyType): PropertyType {
  switch (mcpType) {
    case McpPropertyType.NUMBER:
      return PropertyType.NUMBER;
    case McpPropertyType.BOOLEAN:
      return PropertyType.CHECKBOX;
    case McpPropertyType.OBJECT:
      return PropertyType.OBJECT;
    case McpPropertyType.DATE:
      return PropertyType.DATE_TIME;
    case McpPropertyType.ARRAY:
      return PropertyType.ARRAY;
    case McpPropertyType.TEXT:
    default:
      return PropertyType.SHORT_TEXT;
  }
}

function McpToolTestingDialog(props: McpToolTestingDialogProps) {
  const form = useFormContext();
  const formValues: unknown = form.getValues();
  const formProps = getFormProps(formValues);
  const { mutate: saveMockAsSampleData, isPending: isSavingMockdata } =
    testStepHooks.useSaveMockData({
      onSuccess: () => {
        props.onTestingSuccess();
        props.onOpenChange(false);
      },
    });

  const testingForm = createForm<Record<string, unknown>>({
    shouldFocusError: true,
    defaultValues: formProps
      .filter((field: McpFormField) => field.name.trim() !== '')
      .reduce<Record<string, unknown>>((acc, field: McpFormField) => {
        acc[field.name] = field.type === McpPropertyType.BOOLEAN ? false : '';
        return acc;
      }, {}),
    resolver: (values: Record<string, unknown>) => {
      const errors = formProps.reduce<
        Record<string, { type: string; message: string }>
      >((acc, field: McpFormField) => {
        if (
          field.required &&
          field.type !== McpPropertyType.BOOLEAN &&
          !values[field.name]
        ) {
          acc[field.name] = {
            type: 'required',
            message: t('{field} is required', { field: field.name }),
          };
        }
        return acc;
      }, {});

      if (Object.keys(errors).length === 0) {
        return { values, errors: {} as Record<string, never> };
      }
      return {
        values: {} as Record<string, never>,
        errors,
      };
    },
    mode: 'onChange',
  });

  function fixProperty(key: string): string {
    return key.replace(/[\s/@-]+/g, '_');
  }

  const pieceProps = formProps.reduce((acc, field: McpFormField) => {
    const pieceProperty: PieceProperty = {
      displayName: field.name,
      description: field.description || '',
      required: field.required,
      type: mapMcpTypeToPropertyType(field.type),
      defaultValue: field.defaultValue,
    };

    acc[field.name] = pieceProperty;
    return acc;
  }, {} as PiecePropertyMap);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="w-full max-w-xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle class="px-0.5">{t('Set Sample Data')}</DialogTitle>
          <DialogDescription class="px-0.5">
            {t('Provide sample values for testing this tool trigger.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...testingForm}>
          <form
            class="grid space-y-4"
            onSubmit={testingForm.handleSubmit(
              (data: Record<string, unknown>) => {
                const cleanedData = Object.fromEntries(
                  Object.entries(data)
                    .filter(([key, _]) => key.trim() !== '')
                    .map(([key, value]) => [fixProperty(key), value]),
                );
                saveMockAsSampleData(cleanedData);
              },
            )}
          >
            <ScrollArea class="flex-1 max-h-[50vh]">
              <div class="py-4">
                <Show
                  when={Object.keys(pieceProps).length > 0}
                  fallback={
                    <div class="p-4 rounded-lg text-center">
                      <p class="text-sm text-muted-foreground">
                        {t('No input fields defined in the schema')}
                      </p>
                    </div>
                  }
                >
                  <div class="space-y-4">
                    <For each={Object.entries(pieceProps)}>
                      {([fieldName, fieldProps]) => {
                        const fieldError = getFieldError(
                          testingForm.formState.errors,
                          fieldName,
                        );

                        return (
                          <div class="grid space-y-2 px-0.5">
                            <GenericPropertiesForm
                              props={{ [fieldName]: fieldProps }}
                              propertySettings={null}
                              dynamicPropsInfo={null}
                              prefixValue=""
                              useMentionTextInput={false}
                              disabled={false}
                            />

                            <Show when={fieldError}>
                              <p class="text-xs text-destructive font-medium">
                                {String(fieldError?.message ?? '')}
                              </p>
                            </Show>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => props.onOpenChange(false)}
                disabled={isSavingMockdata}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={isSavingMockdata}>
                {t('Use Sample Data')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function getFieldError(errors: unknown, fieldName: string) {
  if (typeof errors !== 'object' || errors === null || !(fieldName in errors)) {
    return undefined;
  }
  const error = (errors as Record<string, unknown>)[fieldName];
  if (typeof error !== 'object' || error === null || !('message' in error)) {
    return undefined;
  }
  return error;
}

function getFormProps(value: unknown) {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('settings' in value) ||
    typeof value.settings !== 'object' ||
    value.settings === null ||
    !('input' in value.settings) ||
    typeof value.settings.input !== 'object' ||
    value.settings.input === null ||
    !('inputSchema' in value.settings.input) ||
    !Array.isArray(value.settings.input.inputSchema)
  ) {
    return [];
  }
  return value.settings.input.inputSchema.filter(isMcpFormField);
}

function isMcpFormField(value: unknown): value is McpFormField {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'required' in value &&
    typeof value.required === 'boolean' &&
    'type' in value &&
    Object.values(McpPropertyType).includes(value.type as McpPropertyType)
  );
}

export { McpToolTestingDialog };
