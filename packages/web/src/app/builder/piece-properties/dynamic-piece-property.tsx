import {
  ExecutePropsResult,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  AUTHENTICATION_PROPERTY_NAME,
  isNil,
  PieceOptionRequest,
  PropertySettings,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import deepEqual from 'deep-equal';
import { Show, createEffect, createSignal, useContext } from 'solid-js';

import { BuilderForm, useFormContext } from '@/app/builder/builder-form';
import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { SkeletonList } from '@/components/ui/skeleton';
import { formUtils } from '@/features/pieces';
import { piecesApi } from '@/features/pieces/api/pieces-api';
import { authenticationSession } from '@/lib/authentication-session';

import { DynamicPropertiesErrorBoundary } from './dynamic-piece-properties-error-boundary';
import { DynamicPropertiesContext } from './dynamic-properties-context';
import { GenericPropertiesForm } from './generic-properties-form';

const removeOptionsFromDropdownPropertiesSchema = (
  schema: PiecePropertyMap,
): PiecePropertyMap => {
  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => {
      if (
        value.type === PropertyType.STATIC_DROPDOWN ||
        value.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN
      ) {
        return [key, { ...value, options: { disabled: false, options: [] } }];
      }
      return [key, value];
    }),
  ) as PiecePropertyMap;
};

const DynamicPropertiesImplementation = (props: DynamicPropertiesProps) => {
  const [flowVersion, readonly] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.readonly,
  ]);
  const form = useFormContext() as BuilderForm & {
    watch: (name?: string) => unknown;
  };
  let previousRefresherValues: Record<string, unknown> | undefined;
  const { propertyLoadingFinished, propertyLoadingStarted } = useContext(
    DynamicPropertiesContext,
  );
  const [propertyMap, setPropertyMap] = createSignal<
    PiecePropertyMap | undefined
  >(undefined);
  const propertyPrefix = () =>
    props.placedInside === 'stepSettings' ? 'settings.input' : '';
  const { mutate, isPending } = createMutation<
    ExecutePropsResult<PropertyType.DYNAMIC>,
    Error,
    { request: PieceOptionRequest; propertyType: PropertyType.DYNAMIC }
  >(() => ({
    mutationFn: async ({ request, propertyType }) => {
      return piecesApi.options(request, propertyType);
    },
    onMutate: () => {
      propertyLoadingStarted(props.propertyName);
    },
    onError: (error) => {
      console.error(error);
      propertyLoadingFinished(props.propertyName);
    },
    onSuccess: () => {
      propertyLoadingFinished(props.propertyName);
    },
  }));

  const getRefresherValues = () => {
    const values = form.watch(
      props.placedInside === 'stepSettings' ? 'settings.input' : undefined,
    );
    const input =
      values && typeof values === 'object'
        ? (values as Record<string, unknown>)
        : undefined;
    return [...props.refreshers, AUTHENTICATION_PROPERTY_NAME].reduce<
      Record<string, unknown>
    >(
      (acc, refresher) => ({
        ...acc,
        [refresher]: input?.[refresher],
      }),
      {},
    );
  };

  const clearPropertyValue = () => {
    // the field state won't be cleared if you only unset the parent prop value
    if (propertyMap()) {
      Object.keys(propertyMap() ?? {}).forEach((childPropName) => {
        form.setValue(
          prependPrefixToPropertyName({
            propertyName: `${props.propertyName}.${childPropName}`,
            prefix: propertyPrefix(),
          }),
          null,
          {
            //never validate for each prop, it can be a long list of props and cause the browser to freeze
            shouldValidate: false,
          },
        );
      });
    }
    form.setValue(
      prependPrefixToPropertyName({
        propertyName: props.propertyName,
        prefix: propertyPrefix(),
      }),
      null,
      {
        shouldValidate: true,
      },
    );
  };
  createEffect(() => {
    const refresherValues = getRefresherValues();
    if (!deepEqual(previousRefresherValues, refresherValues)) {
      clearPropertyValue();
    }
    previousRefresherValues = refresherValues;
    mutate(
      {
        request: {
          projectId: authenticationSession.getProjectId()!,
          pieceName: props.pieceName,
          pieceVersion: props.pieceVersion,
          propertyName: props.propertyName,
          actionOrTriggerName: props.actionOrTriggerName,
          input: refresherValues,
          flowVersionId: flowVersion.id,
          flowId: flowVersion.flowId,
        },
        propertyType: PropertyType.DYNAMIC,
      },
      {
        onSuccess: (response) => {
          const currentValue: unknown = form.getValues(
            prependPrefixToPropertyName({
              propertyName: props.propertyName,
              prefix: propertyPrefix(),
            }),
          );
          const defaultValue: unknown = formUtils.getDefaultValueForProperties({
            props: response.options,
            existingInput: currentValue ?? {},
            propertySettings: props.propertySettings ?? {},
          });
          setPropertyMap(response.options);
          const schemaWithoutDropdownOptions =
            removeOptionsFromDropdownPropertiesSchema(response.options);
          props.updateFormSchema?.(
            prependPrefixToPropertyName({
              propertyName: props.propertyName,
              prefix: propertyPrefix(),
            }),
            schemaWithoutDropdownOptions,
          );

          if (!readonly && props.updatePropertySettingsSchema) {
            props.updatePropertySettingsSchema(
              schemaWithoutDropdownOptions,
              props.propertyName,
              form,
            );
          }
          form.setValue(
            prependPrefixToPropertyName({
              propertyName: props.propertyName,
              prefix: propertyPrefix(),
            }),
            defaultValue,
            {
              shouldValidate: true,
              shouldDirty: true,
            },
          );
        },
      },
    );
  });

  return (
    <>
      <Show when={isPending}>
        <SkeletonList numberOfItems={3} class="h-7" />
      </Show>
      <Show when={!isPending && propertyMap()}>
        <GenericPropertiesForm
          prefixValue={prependPrefixToPropertyName({
            propertyName: props.propertyName,
            prefix: propertyPrefix(),
          })}
          props={propertyMap()}
          useMentionTextInput={!isNil(props.propertySettings)}
          disabled={props.disabled}
          propertySettings={props.propertySettings}
          dynamicPropsInfo={null}
          onValueChange={() => {
            void form.trigger();
          }}
        />
      </Show>
    </>
  );
};

const DynamicProperties = (props: DynamicPropertiesProps) => {
  return (
    <DynamicPropertiesErrorBoundary>
      <DynamicPropertiesImplementation {...props} />
    </DynamicPropertiesErrorBoundary>
  );
};

export { DynamicProperties };

const prependPrefixToPropertyName = ({
  propertyName,
  prefix,
}: {
  propertyName: string;
  prefix: string;
}) => {
  return prefix.length === 0 ? propertyName : `${prefix}.${propertyName}`;
};

type DynamicPropertiesProps = {
  refreshers: string[];
  propertyName: string;
  pieceName: string;
  pieceVersion: string;
  actionOrTriggerName: string;
  disabled: boolean;
  placedInside: 'stepSettings' | 'predefinedAgentInputs';
  updateFormSchema:
    | ((key: string, newFieldSchema: PiecePropertyMap) => void)
    | null;
  propertySettings: Record<string, PropertySettings> | null;
  updatePropertySettingsSchema:
    | ((
        schema: PiecePropertyMap,
        propertyName: string,
        form: BuilderForm,
      ) => void)
    | null;
};
