import { t } from 'i18next';
import { createMemo, Show } from 'solid-js';

import { UserAvatar } from '@/components/custom/user-avatar';
import { Badge } from '@/components/ui/badge';
import { CommandItem } from '@/components/ui/command';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { EmailStatusType } from './types';
import { SuggestedUser } from './use-user-suggestions';

export function SuggestedUserItem(props: SuggestedUserItemProps) {
  return (
    <Show
      when={props.type === 'platform-user'}
      fallback={
        <EmailStatusSuggestionItem
          {...(props as Extract<
            SuggestedUserItemProps,
            { type: 'email-status' }
          >)}
        />
      }
    >
      <PlatformUserItem
        {...(props as Extract<
          SuggestedUserItemProps,
          { type: 'platform-user' }
        >)}
      />
    </Show>
  );
}

function PlatformUserItem(props: {
  user: SuggestedUser;
  onSelect: (email: string) => void;
}) {
  const isDisabled = createMemo(() => props.user.memberStatus !== 'available');

  const getBadge = () => {
    if (props.user.memberStatus === 'has-access') {
      return {
        label: t('Has Access'),
        className: 'text-primary bg-primary/15',
      };
    }
    if (props.user.memberStatus === 'already-invited') {
      return {
        label: t('Invited'),
        className: 'text-muted-foreground bg-muted-foreground/15',
      };
    }
    return {
      label: formatUtils.convertEnumToHumanReadable(props.user.platformRole),
    };
  };

  const badge = createMemo(getBadge);

  return (
    <CommandItem
      key={props.user.id}
      value={props.user.email}
      onSelect={() => !isDisabled() && props.onSelect(props.user.email)}
      disabled={isDisabled()}
      class={cn('cursor-pointer', isDisabled() && 'opacity-60')}
    >
      <div class="flex items-center gap-2 w-full">
        <UserAvatar
          name={`${props.user.firstName} ${props.user.lastName}`}
          email={props.user.email}
          size={32}
          disableTooltip={true}
          imageUrl={props.user.imageUrl}
        />
        <div class="flex flex-col flex-1 min-w-0">
          <span class="text-sm font-medium truncate">
            {props.user.firstName} {props.user.lastName}
          </span>
          <span class="text-xs text-muted-foreground truncate">
            {props.user.email}
          </span>
        </div>
        <Badge
          variant="ghost"
          class={cn('ml-auto shrink-0 text-xs rounded-sm', badge().className)}
        >
          {badge().label}
        </Badge>
      </div>
    </CommandItem>
  );
}

function EmailStatusSuggestionItem(props: {
  emailStatus: EmailStatusType;
  onSelect: (email: string) => void;
  isPlatformInvite?: boolean;
}) {
  const getBadgeAndState = () => {
    switch (props.emailStatus.type) {
      case 'new-user':
        return {
          label: props.isPlatformInvite ? t('New User') : t('New Member'),
          className:
            'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-900',
          disabled: false,
        };
      case 'has-access':
        return {
          label: t('Has Access'),
          className: 'text-primary bg-primary/15',
          disabled: true,
        };
      case 'in-project':
        return {
          label: t('Member'),
          className: 'text-warning bg-warning/15',
          disabled: true,
        };
      case 'already-invited':
        return {
          label: t('Invited'),
          className: 'text-muted-foreground bg-muted-foreground/15',
          disabled: false,
        };
    }
  };

  const state = createMemo(getBadgeAndState);
  const user = createMemo(() => props.emailStatus.user);

  return (
    <CommandItem
      value={props.emailStatus.email}
      onSelect={() =>
        !state().disabled && props.onSelect(props.emailStatus.email)
      }
      disabled={state().disabled}
      class={cn('cursor-pointer', state().disabled && 'opacity-60')}
    >
      <div class="flex items-center gap-2 w-full">
        <Show when={user()}>
          <UserAvatar
            name={`${user()!.firstName} ${user()!.lastName}`}
            email={user()!.email}
            size={32}
            disableTooltip={true}
            imageUrl={user()!.imageUrl}
          />
        </Show>
        <div class="flex flex-col flex-1 min-w-0">
          <span class="text-sm font-medium truncate">
            {user()
              ? `${user()!.firstName} ${user()!.lastName}`
              : props.emailStatus.email}
          </span>
          <Show when={user()}>
            <span class="text-xs text-muted-foreground truncate">
              {user()!.email}
            </span>
          </Show>
        </div>
        <Badge
          variant="ghost"
          class={cn('ml-auto shrink-0 text-xs rounded-sm', state().className)}
        >
          {state().label}
        </Badge>
      </div>
    </CommandItem>
  );
}

type SuggestedUserItemProps =
  | {
      type: 'platform-user';
      user: SuggestedUser;
      onSelect: (email: string) => void;
    }
  | {
      type: 'email-status';
      emailStatus: EmailStatusType;
      onSelect: (email: string) => void;
      isPlatformInvite?: boolean;
    };
