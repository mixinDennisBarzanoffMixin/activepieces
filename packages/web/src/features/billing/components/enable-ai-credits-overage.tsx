import { t } from 'i18next';
import { Info } from 'lucide-solid';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { billingMutations } from '../hooks/billing-hooks';

interface EnableAIOverageDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EnableAIOverageDialog(props: EnableAIOverageDialogProps) {
  const {
    mutate: createSubscription,
    isPending: isCreatingSubscriptionPending,
  } = billingMutations.useCreateSubscription(props.onOpenChange);

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent class="sm:max-w-[420px] p-8 text-center">
        <div class="flex flex-col items-center">
          <div class="rounded-full bg-purple-50 p-4 mb-6">
            <Info class="w-10 h-10 text-primary" />
          </div>

          <h2 class="text-2xl font-semibold">{t('Start a Subscription')}</h2>
          <p class="mt-2 text-sm max-w-sm">
            {t(
              'To enable AI credit overage and unlock advanced features, please start your subscription first.',
            )}
          </p>

          <div class="mt-8 flex flex-col w-full gap-3">
            <Button
              onClick={() => createSubscription({ newActiveFlowsLimit: 0 })}
              disabled={isCreatingSubscriptionPending}
              loading={isCreatingSubscriptionPending}
              class="w-full"
            >
              {t('Start Subscription (Free)')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
