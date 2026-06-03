import { ApFlagId, BADGES, UserWithBadges } from '@activepieces/shared';
import { t } from 'i18next';
import { Lock } from 'lucide-solid';
import { createMemo, For, mergeProps, Show } from 'solid-js';

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

type Badge = UserWithBadges['badges'][number];
type Name = keyof typeof BADGES;
type Entry = [Name, (typeof BADGES)[Name]];

export const UserBadges = (_props: UserBadgesProps) => {
  const props = mergeProps(
    { showLockedBadges: true, showBorder: false },
    _props,
  );
  const flag = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_BADGES);
  const valid = (b: Badge): b is Badge & { name: Name } => b.name in BADGES;
  const badges = createMemo(() => {
    if (!props.user) {
      return [];
    }
    return props.user.badges;
  });
  const empty = createMemo(
    () => !props.showLockedBadges && badges().length === 0,
  );
  const items = createMemo<Entry[]>(() => {
    if (props.showLockedBadges) {
      return Object.entries(BADGES) as Entry[];
    }
    return badges()
      .filter(valid)
      .map((b) => [b.name, BADGES[b.name]]);
  });

  return (
    <Show when={flag.data && !empty()}>
      <div class={props.showBorder ? 'mt-3 pt-3 border-t' : 'space-y-3'}>
        <h5
          class={`text-xs text-foreground tracking-wide ${
            props.showBorder ? 'mb-2' : ''
          }`}
        >
          {t('Badges')}
        </h5>
        <div class="flex items-center gap-1 flex-wrap">
          <For each={items()}>
            {(item) => {
              const unlocked = createMemo(() =>
                badges().some((b) => b.name === item[0]),
              );

              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div class="cursor-pointer relative">
                      <img
                        src={item[1].imageUrl}
                        alt={item[1].title}
                        class={`h-12 w-12 object-cover rounded-md ${
                          !unlocked() && props.showLockedBadges
                            ? 'opacity-50 grayscale'
                            : ''
                        }`}
                      />
                      <Show when={!unlocked() && props.showLockedBadges}>
                        <div class="absolute inset-0 flex items-center justify-center rounded">
                          <Lock class="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Show>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent class="text-left">
                    <div class="flex flex-col">
                      <p class="font-semibold">{item[1].title}</p>
                      <p class="text-xs">{item[1].description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }}
          </For>
        </div>
      </div>
    </Show>
  );
};
