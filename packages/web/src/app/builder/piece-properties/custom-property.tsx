import { CustomProperty as CustomPropertyType } from '@activepieces/pieces-framework';
import { createEffect, createUniqueId, onCleanup } from 'solid-js';

import { useEmbedding } from '@/components/providers/embed-provider';
import { projectCollectionUtils } from '@/features/projects';
const CUSTOM_PROPERTY_CONTAINER_ID = 'custom-property-container';

type CustomPropertyParams = {
  value: unknown;
  onChange: (value: unknown) => void;
  code: string;
  disabled: boolean;
  property: CustomPropertyType<boolean>;
};

type CustomPropertyRuntimeParams = CustomPropertyParams & {
  containerId: string;
  isEmbedded: boolean;
  projectId: string;
};

type CustomPropertyFunction = (params: CustomPropertyRuntimeParams) => unknown;

const isCleanup = (value: unknown): value is () => void => {
  return typeof value === 'function';
};

const isCustomPropertyFunction = (
  value: unknown,
): value is CustomPropertyFunction => {
  return typeof value === 'function';
};

const isCustomPropertyModule = (
  value: unknown,
): value is { default: unknown } => {
  return typeof value === 'object' && value !== null && 'default' in value;
};

const CustomProperty = (props: CustomPropertyParams) => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { embedState } = useEmbedding();
  const id = createUniqueId();
  const containerId = CUSTOM_PROPERTY_CONTAINER_ID + '-' + id;
  createEffect(() => {
    const url = URL.createObjectURL(
      new Blob([`export default (${props.code});`], {
        type: 'text/javascript',
      }),
    );
    let cleanup: (() => void) | undefined;
    let disposed = false;
    onCleanup(() => {
      disposed = true;
      URL.revokeObjectURL(url);
      cleanup?.();
    });
    try {
      const params: CustomPropertyRuntimeParams = {
        containerId,
        value: props.value,
        onChange: props.onChange,
        isEmbedded: embedState.isEmbedded,
        projectId: project.id,
        disabled: props.disabled,
        property: props.property,
      };
      void import(/* @vite-ignore */ url)
        .then((mod: unknown) => {
          if (!isCustomPropertyModule(mod) || disposed) return;
          if (!isCustomPropertyFunction(mod.default)) return;
          const result = mod.default(params);
          if (isCleanup(result)) cleanup = result;
        })
        .catch((error: unknown) => {
          console.error('Error executing custom code:', error);
        });
    } catch (error) {
      console.error('Error executing custom code:', error);
    }
  });
  return <div id={containerId} />;
};

export default CustomProperty;
