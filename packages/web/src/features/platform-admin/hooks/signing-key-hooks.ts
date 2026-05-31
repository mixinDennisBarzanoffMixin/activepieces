import {
  AddSigningKeyRequestBody,
  AddSigningKeyResponse,
} from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';

import { signingKeyApi } from '../api/signing-key-api';

export const signingKeyKeys = {
  all: ['signing-keys'] as const,
};

export const signingKeyQueries = {
  useSigningKeys: () =>
    createQuery(() => ({
      queryKey: signingKeyKeys.all,
      gcTime: 0,
      staleTime: 0,
      queryFn: () => signingKeyApi.list(),
    })),
};

export const signingKeyMutations = {
  useCreateSigningKey: ({
    onSuccess,
  }: {
    onSuccess: (key: AddSigningKeyResponse) => void;
  }) => {
    return createMutation(() => ({
      mutationFn: (request: AddSigningKeyRequestBody) =>
        signingKeyApi.create(request),
      onSuccess,
    }));
  },
};
