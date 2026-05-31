import { UpdatePlatformRequestBody } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';

import { platformApi } from '@/api/platforms-api';

export const ssoMutations = {
  useUpdatePlatformSso: ({
    platformId,
    refetch,
    onSuccess,
  }: {
    platformId: string;
    refetch: () => Promise<void>;
    onSuccess?: () => void;
  }) => {
    return createMutation(() => ({
      mutationFn: async (request: UpdatePlatformRequestBody) => {
        await platformApi.update(request, platformId);
        await refetch();
      },
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
    }));
  },
};
