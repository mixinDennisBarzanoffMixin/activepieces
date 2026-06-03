import {
  AgentPieceProps,
  AgentProviderModel,
  isNil,
  PieceAction,
} from '@activepieces/shared';
import { For, Show } from 'solid-js';

import { BuilderField, useFormContext } from '@/app/builder/builder-form';
import { AgentTools } from '@/app/builder/step-settings/agent-settings/agent-tools';
import { FormField } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { AIModelSelector, AgentStructuredOutput } from '@/features/agents';

import {
  selectGenericFormComponentForProperty,
  SelectGenericFormComponentForPropertyParams,
} from '../../piece-properties/properties-utils';
import { useStepSettingsContext } from '../step-settings-context';

type AgentSettingsProps = {
  step: PieceAction;
  flowId: string;
  readonly: boolean;
};

export const AgentSettings = (props: AgentSettingsProps) => {
  const { pieceModel, updateFormSchema, updatePropertySettingsSchema } =
    useStepSettingsContext();
  const form = useFormContext<PieceAction>();

  return (
    <Show
      when={!isNil(pieceModel)}
      fallback={
        <div class="space-y-3">
          <For each={Array.from({ length: 5 })}>
            {() => (
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <Skeleton class="w-40 h-4" />
                  <Skeleton class="size-8" />
                </div>
                <Skeleton class="w-full h-12" />
              </div>
            )}
          </For>
        </div>
      }
    >
      <div class="w-full">
        <div class="flex flex-col gap-4 w-full">
          <For
            each={Object.keys(
              pieceModel?.actions[props.step.settings.actionName ?? '']
                ?.props ?? {},
            )}
          >
            {(propertyName) => {
              if (propertyName === 'auth' || !isAgentPieceProp(propertyName)) {
                return null;
              }
              const property =
                pieceModel?.actions[props.step.settings.actionName ?? '']
                  ?.props[propertyName];
              if (isNil(property) || isNil(props.step.settings.actionName)) {
                return null;
              }
              return (
                <FormField
                  key={propertyName}
                  name={`settings.input.${propertyName}`}
                  control={form.control}
                  render={({ field }: { field: BuilderField }) =>
                    selectAgentFormComponentForProperty({
                      field,
                      allowDynamicValues: false,
                      dynamicInputModeToggled: false,
                      markdownVariables: {},
                      propertyName,
                      inputName: `settings.input.${propertyName}`,
                      property,
                      useMentionTextInput: true,
                      disabled: props.readonly,
                      form,
                      dynamicPropsInfo: {
                        pieceName: props.step.settings.pieceName,
                        pieceVersion: props.step.settings.pieceVersion,
                        actionOrTriggerName: props.step.settings.actionName,
                        placedInside: 'stepSettings',
                        updateFormSchema,
                        updatePropertySettingsSchema,
                      },
                      propertySettings: null,
                    })
                  }
                />
              );
            }}
          </For>
        </div>
      </div>
    </Show>
  );
};

type selectFormComponentForPropertyParams =
  SelectGenericFormComponentForPropertyParams & {
    propertyName: AgentPieceProps;
  };
const selectAgentFormComponentForProperty = (
  params: selectFormComponentForPropertyParams,
) => {
  const { propertyName, disabled, field } = params;

  switch (propertyName) {
    case AgentPieceProps.AGENT_TOOLS: {
      const value: unknown = params.form.getValues(
        'settings.input.aiProviderModel',
      );
      return (
        <AgentTools
          disabled={disabled}
          toolsField={field}
          selectedProvider={isProvider(value) ? value.provider : undefined}
        />
      );
    }
    case AgentPieceProps.STRUCTURED_OUTPUT: {
      return (
        <AgentStructuredOutput
          disabled={disabled}
          structuredOutputField={field}
        />
      );
    }
    case AgentPieceProps.AI_PROVIDER_MODEL: {
      if (!isProvider(field.value)) {
        return null;
      }
      return (
        <AIModelSelector
          defaultModel={field.value.model}
          defaultProvider={field.value.provider}
          onChange={field.onChange}
          disabled={disabled}
        />
      );
    }
    default: {
      return selectGenericFormComponentForProperty({
        ...params,
        enableMarkdownForInputWithMention:
          propertyName === AgentPieceProps.PROMPT,
      });
    }
  }
};

function isAgentPieceProp(value: string): value is AgentPieceProps {
  return Object.values(AgentPieceProps).includes(value as AgentPieceProps);
}

function isProvider(value: unknown): value is AgentProviderModel {
  return (
    typeof value === 'object' &&
    !isNil(value) &&
    'provider' in value &&
    'model' in value &&
    typeof value.provider === 'string' &&
    typeof value.model === 'string'
  );
}
