import {
  ApSubscriptionStatus,
  PRICE_PER_EXTRA_ACTIVE_FLOWS,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Zap, Info, Loader2 } from 'lucide-solid';
import { createSignal, createEffect, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { billingMutations, billingQueries } from '../../hooks/billing-hooks';
import { useManagePlanDialogStore } from '../../stores/active-flows-addon-dialog-state';

export function PurchaseExtraFlowsDialog() {
  const { closeDialog, isOpen } = useManagePlanDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: platformPlanInfo, isLoading: isPlatformSubscriptionLoading } =
    billingQueries.usePlatformSubscription(platform.id);

  const activeFlowsUsage = platformPlanInfo?.usage.activeFlows ?? 0;
  const activeFlowsLimit = platformPlanInfo?.plan.activeFlowsLimit ?? 0;
  const platformPlan = platformPlanInfo?.plan;

  const [selectedLimit, setSelectedLimit] = createSignal(activeFlowsLimit);

  const flowPrice = PRICE_PER_EXTRA_ACTIVE_FLOWS;
  const maxFlows = 100;
  const baseActiveFlows = 10;

  const isUpgrade = () => selectedLimit() > activeFlowsLimit;
  const isSame = () => selectedLimit() === activeFlowsLimit;
  const isDowngrade = () => selectedLimit() < activeFlowsLimit;

  const difference = () => Math.abs(selectedLimit() - activeFlowsLimit);

  const calculatePaidFlows = (limit: number) =>
    Math.max(0, limit - baseActiveFlows);
  const currentPaidFlows = calculatePaidFlows(activeFlowsLimit);
  const newPaidFlows = () => calculatePaidFlows(selectedLimit());

  const currentCost = currentPaidFlows * flowPrice;
  const additionalCost = () =>
    isUpgrade() ? (newPaidFlows() - currentPaidFlows) * flowPrice : 0;
  const newTotalCost = () => newPaidFlows() * flowPrice;

  const {
    mutate: updateActiveFlowsLimit,
    isPending: isUpdateActiveFlowsLimitPending,
  } = billingMutations.useUpdateActiveFlowsLimit(() => closeDialog());
  const {
    mutate: createSubscription,
    isPending: isCreatingSubscriptionPending,
  } = billingMutations.useCreateSubscription(() => closeDialog());

  createEffect(() => {
    setSelectedLimit(activeFlowsLimit);
  });

  const isLoading =
    isUpdateActiveFlowsLimitPending || isCreatingSubscriptionPending;

  const handlePurchase = () => {
    if (!isSame() && platformPlan) {
      if (
        platformPlan.stripeSubscriptionStatus !== ApSubscriptionStatus.ACTIVE
      ) {
        createSubscription({ newActiveFlowsLimit: selectedLimit() });
      } else {
        updateActiveFlowsLimit({ newActiveFlowsLimit: selectedLimit() });
      }
    }
  };

  const formatDate = () =>
    dayjs(
      dayjs.unix(platformPlan?.stripeSubscriptionEndDate ?? 0).toISOString(),
    ).format('MMM D, YYYY');

  return (
    <Show when={!isPlatformSubscriptionLoading}>
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent
          class={cn(
            'max-w-[480px] transition-all  border duration-300 ease-in-out',
          )}
        >
          <DialogHeader>
            <DialogTitle class="flex items-center gap-2 text-lg">
              {t('Purchase Extra Active Flows')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'Currently using {activeFlowsUsage} of {activeFlowsLimit} flows',
                { activeFlowsUsage, activeFlowsLimit },
              )}
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-6">
            <div class="space-y-3">
              <div class="flex justify-between text-sm font-medium">
                <span>{t('Select your new limit')}</span>
                <span class="text-primary font-semibold">
                  {t('{selectedLimit} flows', {
                    selectedLimit: selectedLimit(),
                  })}
                </span>
              </div>
              <Slider
                value={[selectedLimit()]}
                onInput={(v) => setSelectedLimit(v[0] ?? baseActiveFlows)}
                min={baseActiveFlows}
                max={maxFlows}
                step={1}
              />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>{baseActiveFlows}</span>
                <span>{maxFlows}</span>
              </div>
            </div>

            <div
              class={cn(
                'rounded-lg border p-4 transition-all duration-300 ease-in-out',
                isUpgrade()
                  ? 'bg-primary/5 border-primary/30'
                  : isDowngrade()
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-muted/40 border-border',
              )}
            >
              <Show when={isUpgrade()}>
                <div class="space-y-3 animate-in fade-in duration-300">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">
                      {t('Current limit')}
                    </span>
                    <span>
                      {t('{activeFlowsLimit} flows', { activeFlowsLimit })}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">
                      {t('Current cost')}
                    </span>
                    <span>
                      {t('${currentCost}/mo', {
                        currentCost: currentCost.toFixed(2),
                      })}
                    </span>
                  </div>

                  <div class="h-px bg-border" />

                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">
                      {t('Additional flows')}
                    </span>
                    <span class="text-primary font-medium">
                      {t('+{difference}', { difference: difference() })}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">
                      {t('Additional cost')}
                    </span>
                    <span class="text-primary font-medium">
                      {t('+${additionalCost}/mo', {
                        additionalCost: additionalCost().toFixed(2),
                      })}
                    </span>
                  </div>

                  <div class="h-px bg-border" />

                  <div class="flex justify-between text-sm font-medium">
                    <span>{t('New total')}</span>
                    <span>
                      {t('{selectedLimit} flows', {
                        selectedLimit: selectedLimit(),
                      })}
                    </span>
                  </div>
                  <div class="flex justify-between items-baseline">
                    <span class="text-sm font-medium">
                      {t('New monthly cost')}
                    </span>
                    <span class="text-xl font-bold text-primary">
                      {t('${newTotalCost}/mo', {
                        newTotalCost: newTotalCost().toFixed(2),
                      })}
                    </span>
                  </div>

                  <div class="h-px bg-border" />

                  <div class="flex justify-between items-baseline">
                    <span class="text-sm font-semibold">{t('Due today')}</span>
                    <span class="text-2xl font-bold text-primary">
                      {t('${additionalCost}', {
                        additionalCost: additionalCost().toFixed(2),
                      })}
                    </span>
                  </div>
                </div>
              </Show>

              <Show when={isDowngrade()}>
                <div class="space-y-3 animate-in fade-in duration-300">
                  <div class="flex items-start text-sm gap-2">
                    <Info class="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                    <div class="space-y-2">
                      <p class="font-medium">
                        {t(
                          'New limit: {selectedLimit} flows (−{difference} flows)',
                          {
                            selectedLimit: selectedLimit(),
                            difference: difference(),
                          },
                        )}
                      </p>
                      <p class="text-muted-foreground">
                        {t('Change takes effect on {date}.', {
                          date: formatDate(),
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </Show>

              <Show when={isSame()}>
                <div class="space-y-3 animate-in fade-in duration-300">
                  <div class="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info class="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p class="font-medium text-foreground mb-1">
                        {t('No changes')}
                      </p>
                      <p>
                        {t(
                          'Your flow limit remains at {activeFlowsLimit} flows (${currentCost}/mo)',
                          {
                            activeFlowsLimit,
                            currentCost: currentCost.toFixed(2),
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeDialog()}
              disabled={isLoading}
            >
              {t('Cancel')}
            </Button>
            <Button
              onClick={handlePurchase}
              class="gap-2"
              disabled={isSame() || isLoading}
            >
              <Show when={isLoading} fallback={<Zap class="w-4 h-4" />}>
                <Loader2 class="w-4 h-4 animate-spin" />
              </Show>
              {isLoading
                ? t('Processing...')
                : isUpgrade()
                ? t('Purchase +{difference} flows', {
                    difference: difference(),
                  })
                : isDowngrade()
                ? t('Confirm Downgrade')
                : t('No Changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Show>
  );
}
