import {
  PropertyType,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  FieldControlMode,
  isNil,
  PredefinedInputField,
} from '@activepieces/shared';
import { t } from 'i18next';
import { For, Show, createEffect, createMemo } from 'solid-js';
import { z } from 'zod';

import {
  BuilderField,
  createForm,
  zodResolver,
} from '@/app/builder/builder-form';
import { ApMarkdown } from '@/components/custom/markdown';
import { Form, FormField } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ConnectionDropdown,
  usePieceToolsDialogStore,
} from '@/features/agents';
import { piecesHooks } from '@/features/pieces';

import { selectGenericFormComponentForProperty } from '../../piece-properties/properties-utils';

const createPredefinedInputsFormSchema = (requireAuth: boolean) =>
  requireAuth
    ? z
        .object({
          auth: z.string().min(1),
        })
        .passthrough()
    : z.object({}).passthrough();

type PredefinedInputsFormValues = z.infer<
  ReturnType<typeof createPredefinedInputsFormSchema>
>;

export const PredefinedInputsForm = () => {
  const {
    predefinedInputs,
    setPredefinedInputs,
    selectedAction,
    selectedPiece: piece,
  } = usePieceToolsDialogStore();
  const usePieces = piecesHooks.usePieces as (props: Record<string, never>) => {
    pieces: PieceMetadataModelSummary[] | undefined;
  };
  const { pieces } = usePieces({});
  const selectedPiece = createMemo(() =>
    pieces?.find((p) => p.name === piece?.pieceName),
  );
  const requireAuth = selectedAction?.requireAuth ?? true;
  const properties = createMemo(() =>
    selectedAction
      ? Object.fromEntries(
          Object.entries(selectedAction.props).map(([name, prop]) => [
            name,
            prop,
          ]),
        )
      : {},
  );
  const getDefaultValues = () => {
    const values: PredefinedInputsFormValues = {};
    if (requireAuth && predefinedInputs?.auth) {
      values.auth = predefinedInputs.auth;
    }
    if (predefinedInputs?.fields) {
      Object.entries(predefinedInputs.fields).forEach(([key, field]) => {
        if (
          field.mode === FieldControlMode.CHOOSE_YOURSELF &&
          !isNil(field.value)
        ) {
          values[key] = field.value;
        }
      });
    }
    return values;
  };
  const form = createForm<PredefinedInputsFormValues>({
    resolver: zodResolver(createPredefinedInputsFormSchema(requireAuth)),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
  const getValue = form.getValues as (name: string) => unknown;
  createEffect(() => {
    const watch = form.watch as (
      callback: (
        values: PredefinedInputsFormValues,
        info: { name?: unknown },
      ) => void,
    ) => { unsubscribe: () => void };
    const subscription = watch((values, info) => {
      const name = typeof info.name === 'string' ? info.name : undefined;
      if (!name || name === 'auth') return;

      const currentPredefined =
        usePieceToolsDialogStore.getState().predefinedInputs;

      const currentFields = currentPredefined?.fields ?? {};
      const newFields = { ...currentFields };

      if (newFields[name].mode === FieldControlMode.CHOOSE_YOURSELF) {
        newFields[name] = {
          ...newFields[name],
          value: values[name],
        };
      }

      setPredefinedInputs({
        ...currentPredefined,
        fields: newFields,
      });
    });

    return () => subscription.unsubscribe();
  });
  const handleAuthChange = (value: string | null) => {
    const newAuth = !isNil(value) ? value : undefined;
    setPredefinedInputs({
      auth: newAuth,
      fields: predefinedInputs?.fields || {},
    });
    form.setValue('auth', value ?? '');
  };
  const getModeForProperty = (propertyName: string): FieldControlMode =>
    predefinedInputs?.fields[propertyName]?.mode ??
    FieldControlMode.AGENT_DECIDE;
  const handleModeChange = (
    propertyName: string,
    newMode: FieldControlMode,
  ) => {
    const currentFields = predefinedInputs?.fields ?? {};
    const prevField = currentFields[propertyName];
    const updatedField: PredefinedInputField = {
      mode: newMode,
      value:
        newMode === FieldControlMode.CHOOSE_YOURSELF
          ? prevField.value ?? form.getValues(propertyName)
          : undefined,
    };
    setPredefinedInputs({
      ...predefinedInputs,
      fields: {
        ...currentFields,
        [propertyName]: updatedField,
      },
    });
    if (newMode === FieldControlMode.CHOOSE_YOURSELF) {
      form.setValue(propertyName, updatedField.value ?? '');
    } else {
      form.setValue(propertyName, undefined, { shouldDirty: false });
    }
  };
  const pieceHasAuth = createMemo(() => requireAuth && selectedPiece()?.auth);
  return (
    <Form {...form}>
      <ScrollArea class="h-full">
        <div class="flex items-start border-b gap-3 p-4">
          <div class="flex size-11 shrink-0 items-center justify-center rounded-sm border bg-background">
            <img
              class="size-8 object-contain"
              src={selectedPiece()?.logoUrl}
              alt={selectedPiece()?.displayName}
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium">{selectedAction?.displayName}</div>
            <Show when={selectedAction?.description}>
              <p class="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {selectedAction.description}
              </p>
            </Show>
          </div>
        </div>
        <div class="space-y-6 p-4">
          <Show when={pieceHasAuth() && !isNil(selectedPiece())}>
            <ConnectionDropdown
              piece={selectedPiece()}
              value={getStringOrNull(getValue('auth'))}
              onChange={handleAuthChange}
              placeholder={t('Connect your account')}
            />
          </Show>
          <Show when={Object.keys(properties()).length > 0}>
            <div class="space-y-5">
              <For each={Object.entries(properties())}>
                {([propertyName, property]) => {
                  const isMarkdown = property.type === PropertyType.MARKDOWN;

                  if (isMarkdown) {
                    return (
                      <ApMarkdown
                        key={propertyName}
                        markdown={property.description}
                        variables={{}}
                        variant={property.variant}
                      />
                    );
                  }

                  const mode = getModeForProperty(propertyName);
                  const showInput = mode === FieldControlMode.CHOOSE_YOURSELF;
                  return (
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <h3 class="text-sm font-medium">
                          {property.displayName}{' '}
                          <Show when={property.required}>{'*'}</Show>
                        </h3>
                        <Select
                          value={mode}
                          onValueChange={(v) =>
                            handleModeChange(
                              propertyName,
                              getFieldControlMode(v),
                            )
                          }
                        >
                          <SelectTrigger class="w-80">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={FieldControlMode.AGENT_DECIDE}>
                              {t('Let agent decide')}
                            </SelectItem>
                            <SelectItem
                              value={FieldControlMode.CHOOSE_YOURSELF}
                            >
                              {t('Set value myself')}
                            </SelectItem>
                            <Show when={!property.required}>
                              <SelectItem value={FieldControlMode.LEAVE_EMPTY}>
                                {t('Leave empty')}
                              </SelectItem>
                            </Show>
                          </SelectContent>
                        </Select>
                      </div>
                      <Show when={showInput}>
                        <FormField
                          name={propertyName}
                          control={form.control}
                          render={({ field }: { field: BuilderField }) =>
                            selectGenericFormComponentForProperty({
                              field,
                              hideLabel: true,
                              propertyName,
                              inputName: propertyName,
                              property,
                              allowDynamicValues: false,
                              markdownVariables: {},
                              useMentionTextInput: true,
                              disabled: false,
                              dynamicInputModeToggled: false,
                              form,
                              dynamicPropsInfo: {
                                pieceName: selectedPiece()?.name ?? '',
                                pieceVersion: selectedPiece()?.version ?? '',
                                actionOrTriggerName: selectedAction?.name ?? '',
                                placedInside: 'predefinedAgentInputs',
                                updateFormSchema: null,
                                updatePropertySettingsSchema: null,
                              },
                              propertySettings: null,
                            })
                          }
                        />
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </ScrollArea>
    </Form>
  );
};

function getFieldControlMode(value: unknown) {
  return Object.values(FieldControlMode).includes(value as FieldControlMode)
    ? (value as FieldControlMode)
    : FieldControlMode.AGENT_DECIDE;
}

function getStringOrNull(value: unknown) {
  return typeof value === 'string' ? value : null;
}
