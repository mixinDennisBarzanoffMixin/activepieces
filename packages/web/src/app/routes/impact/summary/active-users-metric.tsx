import { PlatformAnalyticsReport, UserStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { Users } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type ActiveUsersMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const ActiveUsersMetric = (props: ActiveUsersMetricProps) => {
  const activeUsers = createMemo(
    () =>
      props.report?.users.filter((user) => user.status === UserStatus.ACTIVE)
        .length ?? 0,
  );
  const totalUsers = createMemo(() => props.report?.users.length ?? 0);

  const adoptionRate = createMemo(() =>
    totalUsers() > 0 ? Math.round((activeUsers() / totalUsers()) * 100) : 0,
  );

  return (
    <Show when={props.report} fallback={<MetricCardSkeleton />}>
      <MetricCard
        icon={Users}
        title={t('Active Users')}
        value={activeUsers().toLocaleString()}
        description={t('Users actively using the platform')}
        subtitle={t('{rate}% adoption rate ({total} total users)', {
          rate: adoptionRate(),
          total: totalUsers().toLocaleString(),
        })}
        iconColor="text-amber-500"
        iconBgColor="bg-amber-500/10"
      />
    </Show>
  );
};
