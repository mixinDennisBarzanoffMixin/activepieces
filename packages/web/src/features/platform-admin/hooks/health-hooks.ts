import { createQuery } from '@tanstack/solid-query';

import { healthApi } from '@/api/health-api';

export const healthKeys = {
  all: ['system-health'] as const,
};

export const healthQueries = {
  useSystemHealth: () =>
    createQuery(() => ({
      queryKey: healthKeys.all,
      queryFn: () => healthApi.getSystemHealthChecks(),
    })),
};
