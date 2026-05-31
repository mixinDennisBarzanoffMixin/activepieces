import { Permission } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';

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
  BuilderInitialState & { children?: any },
  'socket' | 'queryClient'
>;

export function BuilderStateProvider({
  children,
  outputSampleData: sampleData,
  inputSampleData: sampleDataInput,
  ...props
}: BuilderStateProviderProps) {
  let storeRef: BuilderStore | undefined;
  const { checkAccess } = useAuthorization();
  const readonly = !checkAccess(Permission.WRITE_FLOW) || props.readonly;
  projectHooks.useReloadPageIfProjectIdChanged(props.flow.projectId);
  const socket = useSocket();
  const queryClient = useQueryClient();
  if (!storeRef) {
    storeRef = createBuilderStore({
      ...props,
      readonly,
      outputSampleData: sampleData,
      inputSampleData: sampleDataInput,
      socket,
      queryClient,
    });
  }

  return (
    <BuilderStateContext.Provider value={storeRef}>
      {children}
    </BuilderStateContext.Provider>
  );
}
