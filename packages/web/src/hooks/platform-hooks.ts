import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import {
  QueryClient,
  createMutation,
  createQuery,
} from '@tanstack/solid-query';
import { t } from 'i18next';
import { toast } from 'solid-sonner';

import { platformApi } from '@/api/platforms-api';
import { queryClient } from '@/app/query-client';
import { authenticationSession } from '@/lib/authentication-session';

import { flagsHooks } from './flags-hooks';

export const platformHooks = {
  useDeleteAccount: () => {
    const navigate = useNavigate();
    return createMutation(
      () => ({
        mutationFn: async () => {
          await platformApi.deleteAccount();
        },
        onSuccess: () => {
          toast.success(t('Account deleted successfully'));
          navigate('/sign-in');
        },
        onError: () => {
          toast.error(t('Failed to delete account. Please try again.'));
        },
      }),
      () => queryClient,
    );
  },
  useCurrentPlatform: () => {
    const currentPlatformId = authenticationSession.getPlatformId();
    const query = createQuery(
      () => ({
        queryKey: ['platform', currentPlatformId],
        queryFn: () => platformApi.getCurrentPlatform(),
        staleTime: Infinity,
      }),
      () => queryClient,
    );
    return {
      platform: query.data,
      refetch: async () => {
        await query.refetch();
      },
      setCurrentPlatform: (
        queryClient: QueryClient,
        platform: PlatformWithoutSensitiveData,
      ) => {
        queryClient.setQueryData(['platform', currentPlatformId], platform);
      },
    };
  },
  useUpdateLisenceKey: (queryClient: QueryClient) => {
    const currentPlatformId = authenticationSession.getPlatformId();

    return createMutation(
      () => ({
        mutationFn: async (tempLicenseKey: string) => {
          if (tempLicenseKey.trim() === '') return;
          await platformApi.verifyLicenseKey(tempLicenseKey.trim());
        },
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: ['platform', currentPlatformId],
          });
          void queryClient.invalidateQueries({
            queryKey: flagsHooks.queryKey,
          });
          toast.success(t('License activated successfully!'));
        },
        onError: () => {
          toast.error(t('Activation failed, invalid license key'));
        },
      }),
      () => queryClient,
    );
  },
};
