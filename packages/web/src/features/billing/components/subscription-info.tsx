import { isNil, PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { CalendarDays } from 'lucide-solid';
import { Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';

type SubscriptionInfoProps = {
  info: PlatformBillingInformation;
};

export const SubscriptionInfo = (props: SubscriptionInfoProps) => {
  return (
    <div class="space-y-4">
      <Badge variant="accent" class="rounded-sm text-sm">
        {isNil(props.info.plan.plan)
          ? t('Free')
          : props.info.plan.plan.charAt(0).toUpperCase() +
            props.info.plan.plan.slice(1)}
      </Badge>
      <div class="flex items-baseline gap-2">
        <div class="text-5xl font-semibold">
          ${props.info.nextBillingAmount || Number(0).toFixed(2)}
        </div>
        <div class="text-xl text-muted-foreground">{t('/month')}</div>
      </div>

      <Show when={props.info.nextBillingDate && isNil(props.info.cancelAt)}>
        <div class="text-sm text-muted-foreground flex items-center gap-2">
          <CalendarDays class="w-4 h-4" />
          <span>
            {t('Next billing date ')}
            <span class="font-semibold">
              {dayjs(
                dayjs.unix(props.info.nextBillingDate).toISOString(),
              ).format('MMM D, YYYY')}
            </span>
          </span>
        </div>
      </Show>

      <Show when={props.info.cancelAt}>
        <div class="text-sm text-muted-foreground flex items-center gap-2">
          <CalendarDays class="w-4 h-4" />
          <span>
            {t('Subscription will end')}{' '}
            <span class="font-semibold">
              {dayjs(dayjs.unix(props.info.cancelAt).toISOString()).format(
                'MMM D, YYYY',
              )}
            </span>
          </span>
        </div>
      </Show>
    </div>
  );
};
