import { useSearchParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { platformHooks } from '@/hooks/platform-hooks';

import { auditEventsApi } from '../api/audit-events-api';

export const auditLogKeys = {
  all: (searchParams: string) => ['audit-logs', searchParams] as const,
};

export const auditLogQueries = {
  useAuditLogs: () => {
    const [searchParams] = useSearchParams();
    const { platform } = platformHooks.useCurrentPlatform();
    return createQuery(() => ({
      queryKey: auditLogKeys.all(new URLSearchParams(searchParams).toString()),
      staleTime: 0,
      gcTime: 0,
      enabled: platform.plan.auditLogEnabled,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
      queryFn: async () => {
        const params = new URLSearchParams(searchParams);
        const cursor = params.get(CURSOR_QUERY_PARAM);
        const limit = params.get(LIMIT_QUERY_PARAM);
        const action = params.getAll('action');
        const projectId = params.getAll('projectId');
        const userId = params.get('userId');
        return auditEventsApi.list({
          cursor: cursor ?? undefined,
          limit: limit ? parseInt(limit) : undefined,
          action: action.length > 0 ? action : undefined,
          projectId: projectId.length > 0 ? projectId : undefined,
          userId: userId ?? undefined,
          createdBefore: params.get('createdBefore') ?? undefined,
          createdAfter: params.get('createdAfter') ?? undefined,
        });
      },
    }));
  },
};
