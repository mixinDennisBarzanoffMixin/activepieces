import { isNil } from '@activepieces/shared';
import { Mail } from 'lucide-solid';
import { mergeProps, Show } from 'solid-js';

import { UserBadges } from '@/components/custom/user-badges';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import { UserAvatar } from './user-avatar';

interface ApAvatarProps {
  id: string | null;
  size: 'small' | 'medium' | 'xsmall';
  includeAvatar?: boolean;
  includeName?: boolean;
  hideHover?: boolean;
}

export const ApAvatar = (_props: ApAvatarProps) => {
  const props = mergeProps(
    {
      includeAvatar: true,
      includeName: false,
      size: 'medium',
      hideHover: false,
    },
    _props,
  );
  const avatarSize = getAvatarSize(props.size);
  const result = userHooks.useUserById(props.id);
  const user = () => result.data;

  const content = (
    <div class="flex items-center gap-2">
      <Show when={props.includeAvatar}>
        <div class="shrink-0">
          <UserAvatar
            name={`${user()?.firstName || ''} ${user()?.lastName || ''}`}
            email={user()?.email || ''}
            imageUrl={user()?.imageUrl}
            size={avatarSize}
            disableTooltip={true}
          />
        </div>
      </Show>
      <Show when={props.includeName}>
        <span
          class={cn('text-xs truncate', {
            'text-xss opacity-75': props.size === 'xsmall',
          })}
        >
          {`${user()?.firstName || ''} ${user()?.lastName || ''}`.trim()}
        </span>
      </Show>
    </div>
  );

  return (
    <Show
      when={user() && !isNil(props.id)}
      fallback={<span class="text-muted-foreground">—</span>}
    >
      <Show when={!props.hideHover} fallback={content}>
        <HoverCard>
          <HoverCardTrigger asChild>
            <div class="cursor-pointer">{content}</div>
          </HoverCardTrigger>
          <HoverCardContent
            class="w-80 rounded-md border bg-background p-4 shadow-md"
            align="start"
          >
            <div class="flex items-center gap-3">
              <UserAvatar
                name={`${user()?.firstName || ''} ${user()?.lastName || ''}`}
                email={user()?.email || ''}
                imageUrl={user()?.imageUrl}
                size={36}
                disableTooltip={true}
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <h4 class="text-sm font-semibold leading-none truncate">
                    {user()?.firstName} {user()?.lastName}
                  </h4>
                </div>
                <div class="flex items-center gap-2 mt-1.5">
                  <Mail class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span class="text-xs text-muted-foreground truncate">
                    {user()?.email}
                  </span>
                </div>
              </div>
            </div>

            <UserBadges
              user={user()}
              showLockedBadges={false}
              showBorder={true}
            />
          </HoverCardContent>
        </HoverCard>
      </Show>
    </Show>
  );
};

function getAvatarSize(size: 'small' | 'medium' | 'xsmall') {
  switch (size) {
    case 'small':
      return 24;
    case 'medium':
      return 32;
    case 'xsmall':
      return 16;
  }
}
