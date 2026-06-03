import { ApFlagId, BADGES, UserWithBadges } from '@activepieces/shared';
import { t } from 'i18next';
import { Lock } from 'lucide-solid';
import { For, mergeProps, Show } from 'solid-js';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';

interface UserBadgesProps {
  user: UserWithBadges | null | undefined;
  showLockedBadges?: boolean;
  showBorder?: boolean;
}

export const UserBadges = (_props: UserBadgesProps) => {
  const props = mergeProps(
    { showLockedBadges: true, showBorder: false },
    _props,
  );
  const flag = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_BADGES);

  if (!flag.data) {
    return null;
  }

  const userBadges = props.user?.badges ?? [];

  if (!props.showLockedBadges && userBadges.length === 0) {
    return null;
  }

  const badgesToShow: [
    keyof typeof BADGES,
    (typeof BADGES)[keyof typeof BADGES],
  ][] = props.showLockedBadges
    ? Object.entries(BADGES)
    : userBadges
        .filter(
          (
            b,
          ): b is (typeof userBadges)[number] & { name: keyof typeof BADGES } =>
            b.name in BADGES,
        )
        .map((b) => [b.name, BADGES[b.name]]);

  return (
    <div class={props.showBorder ? 'mt-3 pt-3 border-t' : 'space-y-3'}>
      <h5
        class={`text-xs text-foreground tracking-wide ${
          props.showBorder ? 'mb-2' : ''
        }`}
      >
        {t('Badges')}
      </h5>
      <div class="flex items-center gap-1 flex-wrap">
        <For each={badgesToShow}>
          {([badgeName, badge]) => {
            const isUnlocked = userBadges.some(
              (userBadge: { name: string; created: string }) =>
                userBadge.name === badgeName,
            );

            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div class="cursor-pointer relative">
                    <img
                      src={badge.imageUrl}
                      alt={badge.title}
                      class={`h-12 w-12 object-cover rounded-md ${
                        !isUnlocked && props.showLockedBadges
                          ? 'opacity-50 grayscale'
                          : ''
                      }`}
                    />
                    <Show when={!isUnlocked && props.showLockedBadges}>
                      <div class="absolute inset-0 flex items-center justify-center rounded">
                        <Lock class="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Show>
                  </div>
                </TooltipTrigger>
                <TooltipContent class="text-left">
                  <div class="flex flex-col">
                    <p class="font-semibold">{badge.title}</p>
                    <p class="text-xs">{badge.description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          }}
        </For>
      </div>
    </div>
  );
};
