import {
  PieceMetadataModel,
  PiecePropertyMap,
  piecePropertiesUtils,
} from '@activepieces/pieces-framework';
import {
  FlowAction,
  FlowActionType,
  setAtPath,
  FlowTrigger,
  FlowTriggerType,
  PropertyExecutionType,
} from '@activepieces/shared';
import {
  JSX,
  createContext,
  createEffect,
  createSignal,
  untrack,
  useContext,
} from 'solid-js';
import { z, ZodObject } from 'zod';

import { BuilderForm } from '@/app/builder/builder-form';
import { formUtils } from '@/features/pieces';
const numberReplacement = 'def.options.0.element';
const stringReplacement = 'shape.';
const createUpdatedSchemaKey = (propertyKey: string) => {
  return propertyKey
    .split('.')
    .map((part) => {
      if (part === '') {
        return ''; // Keep empty parts intact (for consecutive dots)
      } else if (!isNaN(Number(part))) {
        return numberReplacement;
      } else {
        return `${stringReplacement}${part}`;
      }
    })
    .join('.');
};

export type StepSettingsContextState = {
  selectedStep: FlowAction | FlowTrigger;
  pieceModel: PieceMetadataModel | undefined;
  formSchema: ZodObject<z.ZodRawShape>;
  updateFormSchema: (key: string, newFieldSchema: PiecePropertyMap) => void;
  updatePropertySettingsSchema: (
    schema: PiecePropertyMap,
    propertyName: string,
    form: BuilderForm,
  ) => void;
};

export type StepSettingsProviderProps = {
  selectedStep: FlowAction | FlowTrigger;
  pieceModel: PieceMetadataModel | undefined;
  children: JSX.Element;
};

const StepSettingsContext = createContext<StepSettingsContextState | undefined>(
  undefined,
);

export const StepSettingsProvider = (props: StepSettingsProviderProps) => {
  const [formSchema, setFormSchema] = createSignal<ZodObject<z.ZodRawShape>>(
    z.object({}),
  );
  let formSchemaInitializedRef: boolean | undefined;

  createEffect(() => {
    if (formSchemaInitializedRef) {
      return;
    }
    const schema = formUtils.buildPieceSchema(
      props.selectedStep.type,
      getActionOrTriggerName(props.selectedStep),
      props.pieceModel ?? null,
    );
    formSchemaInitializedRef = true;
    setFormSchema(schema);
  });

  const updateFormSchema = (
    key: string,
    newFieldPropertyMap: PiecePropertyMap,
  ) => {
    setFormSchema((prevSchema) => {
      const newFieldSchema = piecePropertiesUtils.buildSchema(
        newFieldPropertyMap,
        undefined,
      );
      const keyUpdated = createUpdatedSchemaKey(key);
      setAtPath(prevSchema, keyUpdated, newFieldSchema);
      return prevSchema;
    });
  };
  const updatePropertySettingsSchema = (
    schema: PiecePropertyMap,
    propertyName: string,
    form: BuilderForm,
  ) => {
    // previously step settings schema didn't have this property, so we need to set it
    // we can't always set it to MANUAL, because some sub properties might be dynamic and have the same name as the dynamic (parent) property i.e values property in insert row (Google Sheets)
    // which will override the sub property exectuion type
    const settings = getPropertySettings(props.selectedStep);
    if (!settings?.[propertyName]) {
      form.setValue(
        `settings.propertySettings.${propertyName}.type`,
        PropertyExecutionType.MANUAL,
      );
    }
    form.setValue(`settings.propertySettings.${propertyName}.schema`, schema);
  };
  return (
    <StepSettingsContext.Provider
      value={{
        selectedStep: untrack(() => props.selectedStep),
        pieceModel: untrack(() => props.pieceModel),
        formSchema,
        updateFormSchema,
        updatePropertySettingsSchema,
      }}
    >
      {props.children}
    </StepSettingsContext.Provider>
  );
};

function getActionOrTriggerName(step: FlowAction | FlowTrigger) {
  if (step.type === FlowActionType.PIECE) {
    return step.settings.actionName;
  }
  if (step.type === FlowTriggerType.PIECE) {
    return step.settings.triggerName;
  }
  return undefined;
}

function getPropertySettings(step: FlowAction | FlowTrigger) {
  if (
    step.type === FlowActionType.PIECE ||
    step.type === FlowTriggerType.PIECE
  ) {
    return step.settings.propertySettings;
  }
  return undefined;
}

export const useStepSettingsContext = () => {
  const context = useContext(StepSettingsContext);
  if (context === undefined) {
    throw new Error(
      'useStepSettingsContext must be used within a PieceSettingsProvider',
    );
  }
  return context;
};
