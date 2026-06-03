import { Permission } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import { JSX, splitProps, untrack } from 'solid-js';

import {
  BuilderInitialState,
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { useSocket } from '@/components/providers/socket-provider';
import { projectHooks } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';

type BuilderStateProviderProps = Omit<
  BuilderInitialState & { children?: JSX.Element },
  'socket' | 'queryClient'
>;

export function BuilderStateProvider(_props: BuilderStateProviderProps) {
  const [local, props] = splitProps(_props, [
    'children',
    'outputSampleData',
    'inputSampleData',
  ]);
  let storeRef: BuilderStore | undefined;
  const { checkAccess } = useAuthorization();
  const readonly = untrack(
    () => !checkAccess(Permission.WRITE_FLOW) || props.readonly,
  );
  projectHooks.useReloadPageIfProjectIdChanged(
    untrack(() => props.flow.projectId),
  );
  const socket = useSocket();
  const queryClient = useQueryClient();
  if (!storeRef) {
    storeRef = createBuilderStore({
      ...props,
      readonly,
      outputSampleData: untrack(() => local.outputSampleData),
      inputSampleData: untrack(() => local.inputSampleData),
      socket,
      queryClient,
    });
  }

  return (
    <BuilderStateContext.Provider value={storeRef}>
      {local.children}
    </BuilderStateContext.Provider>
  );
}
