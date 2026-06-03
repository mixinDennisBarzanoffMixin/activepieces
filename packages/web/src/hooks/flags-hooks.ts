import { ApFlagId } from '@activepieces/shared';
import { createQuery } from '@tanstack/solid-query';
import { createMemo } from 'solid-js';

import { queryClient } from '@/app/query-client';

import { flagsApi } from '../api/flags-api';

type WebsiteBrand = {
  websiteName: string;
  logos: {
    fullLogoUrl: string;
    favIconUrl: string;
    logoIconUrl: string;
  };
  colors: {
    primary: {
      default: string;
      dark: string;
      light: string;
    };
  };
};
const queryKey = ['flags'];
export const flagsHooks = {
  queryKey,
  useFlags: () => {
    return createQuery(
      () => ({
        queryKey,
        queryFn: () => flagsApi.getAll(),
        staleTime: Infinity,
      }),
      () => queryClient,
    );
  },
  useWebsiteBranding: () => {
    const query = flagsHooks.useFlags();
    const branding = createMemo(
      () => query.data?.[ApFlagId.THEME] as WebsiteBrand | undefined,
    );
    return branding;
  },
  useFlag: <T>(flagId: ApFlagId) => {
    const data = createQuery(
      () => ({
        queryKey: ['flags'],
        queryFn: () => flagsApi.getAll(),
        staleTime: Infinity,
      }),
      () => queryClient,
    ).data?.[flagId] as T | null;
    return {
      data,
    };
  },
};
