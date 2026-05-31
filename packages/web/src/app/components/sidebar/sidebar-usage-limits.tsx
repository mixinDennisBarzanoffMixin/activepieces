import { ApEdition, ApFlagId, isNil, PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Info } from 'lucide-solid';
import { Show, For } from 'solid-js';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/format-utils';

const SidebarUsageLimits = () => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const currentUser = userHooks.useCurrentUser();
  const isPlatformAdmin = currentUser.data?.platformRole === PlatformRole.ADMIN;
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (edition !== ApEdition.CLOUD) {
    return null;
  }

  if (isNil(project)) {
    return (
      <div className="flex flex-col w-full p-2.5 bg-background rounded-md border">
        <div className="flex flex-col gap-2">
          {
            <For each={[1, 2, 3]}>
              {(i) => (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton class="size-4" />
                    <Skeleton class="w-20 h-4" />
                  </div>
                  <Skeleton class="w-16 h-4" />
                </div>
              )}
            </For>
          }
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full p-2.5 bg-background rounded-md border">
      <div className="flex flex-col gap-1.5">
        <UsageRow name={t('Runs')} isUnlimited={true} />
        <UsageRow
          name={t('AI Credits')}
          value={Math.round(platform.usage?.aiCreditsRemaining ?? 0)}
          suffix={t('remaining')}
          tooltip={t(
            'Used when running AI pieces with Activepieces as the provider instead of your own API keys.',
          )}
        />
        <UsageRow
          name={t('Active Flows')}
          value={platform.usage?.activeFlows ?? 0}
          max={platform?.plan.activeFlowsLimit}
        />
        {
          <Show when={isPlatformAdmin}>
            <a
              href="/platform/setup/billing"
              class="flex items-center gap-1 text-xs text-foreground/80 hover:text-foreground mt-3 w-fit"
            >
              <span>{t('Manage Plan')}</span>
              <ChevronRight class="size-4" />
            </a>
          </Show>
        }
      </div>
    </div>
  );
};

type UsageRowProps = {
  name: string;
  value?: number | null;
  max?: number | null;
  isUnlimited?: boolean;
  suffix?: string;
  tooltip?: string;
};

const UsageRow = ({
  name,
  value,
  max,
  isUnlimited,
  suffix,
  tooltip,
}: UsageRowProps) => {
  const hasMax = !isNil(max);

  return (
    <div className="flex items-center justify-between gap-2 w-full text-xs">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">•</span>
        <span className="truncate font-medium">{name}</span>
        {
          <Show when={tooltip}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info class="size-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" class="max-w-[220px]">
                <p className="text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </Show>
        }
      </div>
      <div className="flex items-center gap-2 text-foreground">
        {
          <Show
            when={isUnlimited}
            fallback={
              <Show
                when={suffix}
                fallback={
                  <span>
                    {formatUtils.formatNumber(value ?? 0)} /{' '}
                    {hasMax ? formatUtils.formatNumber(max) : t('Unlimited')}
                  </span>
                }
              >
                <span>
                  {formatUtils.formatNumber(value ?? 0)} {suffix}
                </span>
              </Show>
            }
          >
            <span className="text-muted-foreground">{t('Unlimited')}</span>
          </Show>
        }
      </div>
    </div>
  );
};
export default SidebarUsageLimits;
