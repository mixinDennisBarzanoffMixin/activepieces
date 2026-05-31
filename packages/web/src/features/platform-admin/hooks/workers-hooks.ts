import { WorkerMachineWithStatus } from '@activepieces/shared';
import { createQuery } from '@tanstack/solid-query';

import { workersApi } from '../api/workers-api';

export const workersKeys = {
  all: ['worker-machines'] as const,
};

export const workersQueries = {
  useWorkerMachines: () =>
    createQuery<WorkerMachineWithStatus[]>({
      queryKey: workersKeys.all,
      staleTime: 0,
      gcTime: 0,
      refetchInterval: 5000,
      queryFn: () => workersApi.list(),
    }),
};
