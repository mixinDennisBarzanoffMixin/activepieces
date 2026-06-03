import {
  DropdownState,
  ExecutePropsResult,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  AUTHENTICATION_PROPERTY_NAME,
  isNil,
  PieceOptionRequest,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { createEffect, createSignal, useContext, Show } from 'solid-js';

import { BuilderForm } from '@/app/builder/builder-form';
import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { piecesApi } from '@/features/pieces/api/pieces-api';
import { authenticationSession } from '@/lib/authentication-session';

import { MultiSelectPieceProperty } from '../../../components/custom/multi-select-piece-property';

import { DynamicPropertiesErrorBoundary } from './dynamic-piece-properties-error-boundary';
import { DynamicPropertiesContext } from './dynamic-properties-context';

const DynamicDropdownPiecePropertyImplementation = (
  props: DynamicDropdownProps,
) => {
  const [flowVersion, readonly] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.readonly,
  ]);

  let isFirstRender = true;
  let previousValues: undefined | unknown[];
  let firstDropdownState: DropdownState<unknown> | undefined;
  const refreshersWithAuth = () => [
    ...props.refreshers,
    AUTHENTICATION_PROPERTY_NAME,
  ];
  const [dropdownState, setDropdownState] = createSignal<
    DropdownState<unknown>
  >({
    disabled: false,
    placeholder: t('Select an option'),
    options: [],
  });
  const { propertyLoadingFinished, propertyLoadingStarted } = useContext(
    DynamicPropertiesContext,
  );
  const { mutate, isPending, error } = createMutation<
    ExecutePropsResult<PropertyType.DROPDOWN>,
    Error,
    { request: PieceOptionRequest; propertyType: PropertyType.DROPDOWN }
  >(() => ({
    mutationFn: async ({ request, propertyType }) =>
      piecesApi.options(request, propertyType),
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

  const getRefresherValues = () =>
    refreshersWithAuth().map((refresher) => {
      const value: unknown = props.form.watch(
        props.placedInside === 'stepSettings'
          ? `settings.input.${refresher}`
          : refresher,
      );
      return value;
    });

  const refresh = (term?: string) => {
    const input: Record<string, unknown> = {};
    const values = getRefresherValues();
    refreshersWithAuth().forEach((refresher, index) => {
      input[refresher] = values[index];
    });
    mutate(
      {
        request: {
          projectId: authenticationSession.getProjectId()!,
          pieceName: props.pieceName,
          pieceVersion: props.pieceVersion,
          propertyName: props.propertyName,
          actionOrTriggerName: props.actionOrTriggerName,
          input,
          flowVersionId: flowVersion.id,
          flowId: flowVersion.flowId,
          searchValue: term,
        },
        propertyType: PropertyType.DROPDOWN,
      },
      {
        onSuccess: (response) => {
          if (!firstDropdownState) {
            firstDropdownState = response.options;
          }
          setDropdownState(response.options);
        },
      },
    );
  };

  createEffect(() => {
    const values = getRefresherValues();
    if (!isFirstRender && !deepEqual(previousValues, values)) {
      props.onChange(null);
    }

    previousValues = values;
    isFirstRender = false;
    refresh();
  });

  const selectOptions = () =>
    dropdownState().options.map((option) => ({
      label: option.label,
      value: option.value,
    }));
  const isDisabled = () => dropdownState().disabled || props.disabled;
  if (error) {
    throw error;
  }
  return (
    <>
      <Show
        when={props.multiple}
        fallback={
          <SearchableSelect
            options={selectOptions()}
            disabled={dropdownState().disabled || props.disabled}
            loading={isPending}
            placeholder={dropdownState().placeholder ?? t('Select an option')}
            value={props.value}
            onChange={(value) => props.onChange(value)}
            showDeselect={
              props.showDeselect && !isNil(props.value) && !props.disabled
            }
            onRefresh={refresh}
            showRefresh={!isPending && !readonly}
            refreshOnSearch={props.shouldRefreshOnSearch ? refresh : undefined}
            cachedOptions={firstDropdownState?.options ?? []}
          />
        }
      >
        <MultiSelectPieceProperty
          placeholder={dropdownState().placeholder ?? t('Select an option')}
          options={selectOptions()}
          loading={isPending}
          onChange={(value) => props.onChange(value)}
          disabled={isDisabled()}
          initialValues={props.value}
          showDeselect={
            props.showDeselect &&
            !isNil(props.value) &&
            Array.isArray(props.value) &&
            props.value.length > 0 &&
            !isDisabled()
          }
          showRefresh={!isPending && !readonly}
          onRefresh={refresh}
          refreshOnSearch={props.shouldRefreshOnSearch ? refresh : undefined}
          cachedOptions={firstDropdownState?.options ?? []}
        />
      </Show>
    </>
  );
};

const DynamicDropdownPieceProperty = (props: DynamicDropdownProps) => {
  return (
    <DynamicPropertiesErrorBoundary>
      <DynamicDropdownPiecePropertyImplementation {...props} />
    </DynamicPropertiesErrorBoundary>
  );
};

export { DynamicDropdownPieceProperty };
type DynamicDropdownProps = {
  refreshers: string[];
  propertyName: string;
  value?: unknown;
  multiple?: boolean;
  disabled: boolean;
  onChange: (value: unknown) => void;
  showDeselect?: boolean;
  shouldRefreshOnSearch?: boolean;
  actionOrTriggerName: string;
  pieceName: string;
  pieceVersion: string;
  form: BuilderForm & { watch: (name?: string) => unknown };
  placedInside: 'stepSettings' | 'predefinedAgentInputs';
};
