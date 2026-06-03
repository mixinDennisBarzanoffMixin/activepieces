import { createEffect } from 'solid-js';

import { useResourceLock } from '@/hooks/use-resource-lock';

import { useBuilderStateContext } from '../../builder-hooks';

function useFlowLock() {
  const [readonly, flowId, setReadOnly] = useBuilderStateContext((state) => [
    state.readonly,
    state.flow.id,
    state.setReadOnly,
  ]);
  let readonlySetByLock = false;

  const { lockedBy, takeOver } = useResourceLock({
    resourceId: flowId,
  });

  createEffect(() => {
    if (lockedBy && !readonly) {
      readonlySetByLock = true;
      setReadOnly(true);
    }
    if (!lockedBy && readonlySetByLock) {
      readonlySetByLock = false;
      setReadOnly(false);
    }
  });

  return { lockedBy, takeOver };
}

export { useFlowLock };
