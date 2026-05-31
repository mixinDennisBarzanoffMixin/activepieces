import {
  PieceMetadataModel,
  PiecePropertyMap,
  piecePropertiesUtils,
} from '@activepieces/pieces-framework';
import {
  FlowAction,
  setAtPath,
  FlowTrigger,
  PropertyExecutionType,
} from '@activepieces/shared';
import { createContext, createSignal, useContext } from 'solid-js';
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
  formSchema: ZodObject<any>;
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
  children: any;
};

const StepSettingsContext = createContext<StepSettingsContextState | undefined>(
  undefined,
);

export const StepSettingsProvider = ({
  selectedStep,
  pieceModel,
  children,
}: StepSettingsProviderProps) => {
  const [formSchema, setFormSchema] = createSignal<ZodObject<any>>(
    z.object({}) as ZodObject<any>,
  );
  let formSchemaInitializedRef: boolean | undefined;

  if (!formSchemaInitializedRef && selectedStep) {
    const schema = formUtils.buildPieceSchema(
      selectedStep.type,
      selectedStep.settings.actionName ?? selectedStep.settings.triggerName,
      pieceModel ?? null,
    );
    formSchemaInitializedRef = true;
    setFormSchema(schema as ZodObject<any>);
  }

  const updateFormSchema = (
    key: string,
    newFieldPropertyMap: PiecePropertyMap,
  ) => {
    setFormSchema((prevSchema) => {
      const newFieldSchema = piecePropertiesUtils.buildSchema(
        newFieldPropertyMap,
        undefined,
      );
      const currentSchema = Object.create(
        Object.getPrototypeOf(prevSchema),
        Object.getOwnPropertyDescriptors(prevSchema),
      );
      const keyUpdated = createUpdatedSchemaKey(key);
      setAtPath(currentSchema, keyUpdated, newFieldSchema);
      return currentSchema;
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
    if (!selectedStep.settings?.propertySettings?.[propertyName]) {
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
        selectedStep,
        pieceModel,
        formSchema,
        updateFormSchema,
        updatePropertySettingsSchema,
      }}
    >
      {children}
    </StepSettingsContext.Provider>
  );
};

export const useStepSettingsContext = () => {
  const context = useContext(StepSettingsContext);
  if (context === undefined) {
    throw new Error(
      'useStepSettingsContext must be used within a PieceSettingsProvider',
    );
  }
  return context;
};
