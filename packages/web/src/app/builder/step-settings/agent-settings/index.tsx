import {
  AgentPieceProps,
  AgentProviderModel,
  AIProviderName,
  isNil,
  PieceAction,
  PieceActionSettings,
} from '@activepieces/shared';
import { useFormContext } from '@/app/builder/builder-form';
import { For } from 'solid-js';

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
  const form = useFormContext();

  if (isNil(pieceModel)) {
    return (
      <div className="space-y-3">
        <For each={Array.from({ length: 5 })}>
          {(_, index) => (
            <div className="space-y-2" key={index}>
              <div className="flex justify-between items-center">
                <Skeleton class="w-40 h-4" />
                <Skeleton class="size-8" />
              </div>
              <Skeleton class="w-full h-12" />
            </div>
          )}
        </For>
      </div>
    );
  }

  const actionName = (props.step.settings as PieceActionSettings)
    .actionName as string;
  const selectedAction = pieceModel.actions[actionName];
  const properties = (({ auth: _auth, ...rest }) => rest)(selectedAction.props);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 w-full">
        <For each={Object.keys(properties)}>
          {(propertyName) => {
            return (
              <FormField
                key={propertyName}
                name={`settings.input.${propertyName}`}
                control={form.control}
                render={({ field }) =>
                  selectAgentFormComponentForProperty({
                    field,
                    allowDynamicValues: false,
                    dynamicInputModeToggled: false,
                    markdownVariables: {},
                    propertyName: propertyName,
                    inputName: `settings.input.${propertyName}`,
                    property: properties[propertyName],
                    useMentionTextInput: true,
                    disabled: props.readonly,
                    form: form,
                    dynamicPropsInfo: {
                      pieceName: props.step.settings.pieceName,
                      pieceVersion: props.step.settings.pieceVersion,
                      actionOrTriggerName: actionName,
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
  );
};

type selectFormComponentForPropertyParams =
  SelectGenericFormComponentForPropertyParams;
const selectAgentFormComponentForProperty = (
  params: selectFormComponentForPropertyParams,
) => {
  const { propertyName, disabled, field } = params;

  switch (propertyName) {
    case AgentPieceProps.AGENT_TOOLS: {
      const providerModel = params.form?.watch?.(
        'settings.input.aiProviderModel',
      ) as AgentProviderModel | undefined;
      return (
        <AgentTools
          disabled={disabled}
          toolsField={field}
          selectedProvider={
            providerModel?.provider as AIProviderName | undefined
          }
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
      const provider = (field.value as AgentProviderModel).provider;
      const model = (field.value as AgentProviderModel).model;
      return (
        <AIModelSelector
          defaultModel={model}
          defaultProvider={provider}
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
