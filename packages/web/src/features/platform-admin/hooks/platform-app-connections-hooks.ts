import { AppConnectionStatus } from '@activepieces/shared';
import { useSearchParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';

import { platformAppConnectionsApi } from '../api/platform-app-connections-api';

export const platformAppConnectionsKeys = {
  list: (searchParams: string) =>
    ['platform-app-connections', searchParams] as const,
  owners: () => ['platform-app-connections', 'owners'] as const,
};

export const platformAppConnectionsQueries = {
  useList: () => {
    const [searchParams] = useSearchParams();
    return createQuery(() => ({
      queryKey: platformAppConnectionsKeys.list(
        new URLSearchParams(searchParams).toString(),
      ),
      staleTime: 0,
      gcTime: 0,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
      queryFn: () => {
        const params = new URLSearchParams(searchParams);
        const cursor = params.get(CURSOR_QUERY_PARAM);
        const limit = params.get(LIMIT_QUERY_PARAM);
        const status = params.getAll('status').filter(isStatus);
        const projectIds = params.getAll('projectIds');
        const ownerIds = params.getAll('ownerIds');
        return platformAppConnectionsApi.list({
          cursor: cursor ?? undefined,
          limit: limit ? parseInt(limit) : undefined,
          displayName: params.get('displayName') ?? undefined,
          pieceName: params.get('pieceName') ?? undefined,
          status: status.length > 0 ? status : undefined,
          projectIds: projectIds.length > 0 ? projectIds : undefined,
          ownerIds: ownerIds.length > 0 ? ownerIds : undefined,
        });
      },
    }));
  },
  useOwners: () =>
    createQuery(() => ({
      queryKey: platformAppConnectionsKeys.owners(),
      queryFn: () => platformAppConnectionsApi.listOwners(),
    })),
};

const statuses: string[] = Object.values(AppConnectionStatus);

const isStatus = (value: string): value is AppConnectionStatus =>
  statuses.includes(value);
