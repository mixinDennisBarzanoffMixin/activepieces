import {
  UpdateActiveFlowsAddonParams,
  CreateSubscriptionParams,
  CreateAICreditCheckoutSessionParamsSchema,
  UpdateAICreditsAutoTopUpParamsSchema,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import {
  QueryClient,
  createMutation,
  createQuery,
} from '@tanstack/solid-query';
import { t } from 'i18next';
import { toast } from 'solid-sonner';

import { internalErrorToast } from '@/components/ui/sonner';

import { platformBillingApi } from '../api/billing-plans-api';

export const billingKeys = {
  platformSubscription: (platformId: string) =>
    ['platform-billing-subscription', platformId] as const,
};

export const billingMutations = {
  usePortalLink: () => {
    return createMutation(() => ({
      mutationFn: async () => {
        const portalLink = await platformBillingApi.getPortalLink();
        window.open(portalLink, '_blank');
      },
    }));
  },
  useUpdateActiveFlowsLimit: (setIsOpen?: (isOpen: boolean) => void) => {
    const navigate = useNavigate();
    return createMutation<string, Error, UpdateActiveFlowsAddonParams>(() => ({
      mutationFn: (params) =>
        platformBillingApi.updateActiveFlowsLimits(params),
      onSuccess: (url) => {
        setIsOpen?.(false);
        navigate(url);
        toast.success(t('Plan updated successfully'), {
          duration: 3000,
        });
      },
      onError: () => {
        navigate(`/platform/setup/billing/error`);
      },
    }));
  },
  useCreateSubscription: (setIsOpen?: (isOpen: boolean) => void) => {
    return createMutation<void, Error, CreateSubscriptionParams>(() => ({
      mutationFn: async (params: CreateSubscriptionParams) => {
        const checkoutSessionURl = await platformBillingApi.createSubscription(
          params,
        );
        window.open(checkoutSessionURl, '_blank');
      },
      onSuccess: () => {
        setIsOpen?.(false);
      },
      onError: (error: Error) => {
        toast.error(t('Starting Subscription failed'), {
          description: t(error.message),
          duration: 3000,
        });
      },
    }));
  },
  useCreateAICreditCheckoutSession: (setIsOpen?: (isOpen: boolean) => void) => {
    return createMutation(() => ({
      mutationFn: async (params: CreateAICreditCheckoutSessionParamsSchema) => {
        const { stripeCheckoutUrl } =
          await platformBillingApi.createAICreditCheckoutSession(params);
        window.open(stripeCheckoutUrl, '_blank');
      },
      onSuccess: () => {
        setIsOpen?.(false);
      },
      onError: (error: Error) => {
        toast.error(t('Starting Checkout Session failed'), {
          description: t(error.message),
          duration: 3000,
        });
      },
    }));
  },
  useUpdateAutoTopUp: (queryClient: QueryClient) => {
    return createMutation<void, Error, UpdateAICreditsAutoTopUpParamsSchema>(
      () => ({
        mutationFn: async (params: UpdateAICreditsAutoTopUpParamsSchema) => {
          const { stripeCheckoutUrl } =
            await platformBillingApi.updateAutoTopUp(params);
          if (stripeCheckoutUrl) {
            window.open(stripeCheckoutUrl, '_blank');
          }
        },
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: ['platform-billing-subscription'],
          });
          toast.success(t('Auto top-up config saved'));
        },
        onError: () => {
          toast.error(t('Auto top-up config change failed'));
          internalErrorToast();
        },
      }),
    );
  },
};

export const billingQueries = {
  usePlatformSubscription: (platformId: string) => {
    return createQuery<PlatformBillingInformation, Error>(() => ({
      queryKey: billingKeys.platformSubscription(platformId),
      queryFn: () => platformBillingApi.getSubscriptionInfo(),
    }));
  },
};
