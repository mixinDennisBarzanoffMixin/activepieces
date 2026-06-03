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
      <div class="flex flex-col w-full p-2.5 bg-background rounded-md border">
        <div class="flex flex-col gap-2">
          {
            <For each={[1, 2, 3]}>
              {() => (
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
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
    <div class="flex flex-col w-full p-2.5 bg-background rounded-md border">
      <div class="flex flex-col gap-1.5">
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

const UsageRow = (props: UsageRowProps) => {
  return (
    <div class="flex items-center justify-between gap-2 w-full text-xs">
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground">•</span>
        <span class="truncate font-medium">{props.name}</span>
        {
          <Show when={props.tooltip}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info class="size-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" class="max-w-[220px]">
                <p class="text-sm">{props.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </Show>
        }
      </div>
      <div class="flex items-center gap-2 text-foreground">
        {
          <Show
            when={props.isUnlimited}
            fallback={
              <Show
                when={props.suffix}
                fallback={
                  <span>
                    {formatUtils.formatNumber(props.value ?? 0)} /{' '}
                    {!isNil(props.max)
                      ? formatUtils.formatNumber(props.max)
                      : t('Unlimited')}
                  </span>
                }
              >
                <span>
                  {formatUtils.formatNumber(props.value ?? 0)} {props.suffix}
                </span>
              </Show>
            }
          >
            <span class="text-muted-foreground">{t('Unlimited')}</span>
          </Show>
        }
      </div>
    </div>
  );
};
export default SidebarUsageLimits;
