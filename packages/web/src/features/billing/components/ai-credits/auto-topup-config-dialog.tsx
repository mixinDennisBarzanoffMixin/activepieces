import {
  UpdateAICreditsAutoTopUpParamsSchema,
  AiCreditsAutoTopUpState,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Loader2 } from 'lucide-solid';
import { createSignal, mergeProps, untrack, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import { billingMutations } from '../../hooks/billing-hooks';

interface AutoTopUpConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentThreshold?: number | null;
  currentCreditsToAdd?: number | null;
  currentMaxMonthlyLimit?: number | null;
  isEditing?: boolean;
}

export function AutoTopUpConfigDialog(_props: AutoTopUpConfigDialogProps) {
  const props = mergeProps({ isEditing: false }, _props);
  const queryClient = useQueryClient();
  const [threshold, setThreshold] = createSignal(
    untrack(() => props.currentThreshold ?? 1000),
  );
  const [creditsToAdd, setCreditsToAdd] = createSignal(
    untrack(() => props.currentCreditsToAdd ?? 10000),
  );
  const [maxMonthlyLimit, setMaxMonthlyLimit] = createSignal<number | null>(
    untrack(() => props.currentMaxMonthlyLimit ?? null),
  );

  const { mutate: updateAutoTopUp, isPending: isUpdating } =
    billingMutations.useUpdateAutoTopUp(queryClient);

  const isPending = isUpdating;

  const handleSave = () => {
    const params: UpdateAICreditsAutoTopUpParamsSchema = {
      minThreshold: threshold(),
      creditsToAdd: creditsToAdd(),
      maxMonthlyLimit: maxMonthlyLimit(),
      state: AiCreditsAutoTopUpState.ENABLED,
    };

    const onSuccess = () => {
      props.onOpenChange(false);
    };

    updateAutoTopUp(params, { onSuccess });
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {props.isEditing
              ? t('Edit Auto Top-up Configuration')
              : t('Enable Auto Top-up')}
          </DialogTitle>
          <DialogDescription>
            {t('Automatically purchase credits when your balance runs low.')}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-6 py-4">
          <div class="space-y-6">
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <Label>{t('When credits fall below')}</Label>
                <span class="text-sm font-medium text-primary">
                  {t('{threshold} credits', {
                    threshold: threshold().toLocaleString(),
                  })}
                </span>
              </div>
              <Slider
                value={[threshold()]}
                onInput={(v) => setThreshold(v[0] ?? 0)}
                min={0}
                max={100000}
                step={1000}
              />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>{t('0')}</span>
                <span>{t('100,000')}</span>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <Label>{t('Add this many credits')}</Label>
                <span class="text-sm font-medium text-primary">
                  {t('{creditsToAdd} credits', {
                    creditsToAdd: creditsToAdd().toLocaleString(),
                  })}
                </span>
              </div>
              <Slider
                value={[creditsToAdd()]}
                onInput={(v) => setCreditsToAdd(v[0] ?? 1000)}
                min={1000}
                max={500000}
                step={1000}
              />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>{t('1,000')}</span>
                <span>{t('500,000')}</span>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <div class="flex flex-col gap-0.5">
                  <Label>{t('Monthly spending limit')}</Label>
                  <span class="text-xs text-muted-foreground whitespace-nowrap">
                    {t('Maximum credits to add per month')}
                  </span>
                </div>
                <span class="text-sm font-medium text-primary">
                  {maxMonthlyLimit()
                    ? t('{maxMonthlyLimit} credits (${usd})', {
                        maxMonthlyLimit: maxMonthlyLimit()!.toLocaleString(),
                        usd: (maxMonthlyLimit()! / 1000).toFixed(2),
                      })
                    : t('No limit')}
                </span>
              </div>
              <Slider
                value={[maxMonthlyLimit() ?? 0]}
                onInput={(v) => setMaxMonthlyLimit(!v[0] ? null : v[0])}
                min={0}
                max={2000000}
                step={10000}
              />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>{t('No limit')}</span>
                <span>{t('2,000,000')}</span>
              </div>
            </div>
          </div>

          <div class="rounded-lg border p-4 bg-primary/5 border-primary/30">
            <div class="space-y-3 animate-in fade-in duration-300">
              <div class="flex justify-between items-baseline">
                <span class="text-sm font-semibold">
                  {t('Payment per top-up')}
                </span>
                <span class="text-2xl font-bold text-primary">
                  {t('${totalCost}', {
                    totalCost: (creditsToAdd() / 1000).toFixed(2),
                  })}
                </span>
              </div>
              <div class="text-xs text-muted-foreground text-right">
                {t('$1 per 1000 credits')}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => props.onOpenChange(false)}
            disabled={isPending}
          >
            {t('Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            <Show when={isPending}>
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
            </Show>
            {t('Save Configuration')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
