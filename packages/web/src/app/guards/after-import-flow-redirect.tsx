import { useNavigate, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { createEffect } from 'solid-js';

import { flowHooks } from '@/features/flows';

export const AfterImportFlowRedirect = () => {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  createEffect(() => {
    if (flowId) {
      queryClient.removeQueries({
        queryKey: flowHooks.createFlowQueryKeys({
          flowId,
          versionId: undefined,
        }),
      });
    }
    navigate(`/flows/${flowId}`, { replace: true });
  });
  return <></>;
};
