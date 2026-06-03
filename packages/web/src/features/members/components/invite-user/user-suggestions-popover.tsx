import { InvitationType } from '@activepieces/shared';
import { t } from 'i18next';
import { Globe, UserCheck } from 'lucide-solid';
import { createSignal, For, Show } from 'solid-js';

import { TagInput, TagMeta } from '@/components/custom/tag-input';
import { Command, CommandGroup, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatUtils } from '@/lib/format-utils';

import { SuggestedUserItem } from './suggested-user-item';
import { useUserSuggestions } from './use-user-suggestions';

function UserSuggestionsPopover(props: UserSuggestionsPopoverProps) {
  const [inputValue, setInputValue] = createSignal('');
  const [showSuggestions, setShowSuggestions] = createSignal(false);
  const [selectedValue, setSelectedValue] = createSignal('');
  const [tagInputKey, setTagInputKey] = createSignal(0);
  let inputRef: HTMLInputElement | undefined;
  const isPlatformInvite = () =>
    props.invitationType === InvitationType.PLATFORM;

  const {
    suggestedUsers,
    emailStatus,
    hasSuggestions,
    selectableItems,
    platformUserEmails,
  } = useUserSuggestions({
    // eslint-disable-next-line solid/reactivity
    inputValue: inputValue(),
    // eslint-disable-next-line solid/reactivity
    currentEmails: Array.from(props.value),
    isPlatformInvite: isPlatformInvite(),
  });

  const getTagMeta = (email: string): TagMeta | undefined => {
    const trimmed = email.trim();
    if (!formatUtils.emailRegex.test(trimmed)) {
      return { tooltip: t('Invalid email') };
    }
    if (platformUserEmails().has(trimmed.toLowerCase())) {
      return {
        className:
          'text-primary bg-primary/10 border-primary/20 dark:bg-primary/15',
        icon: <UserCheck class="size-3 shrink-0" />,
        tooltip: t('Platform member'),
      };
    }
    return {
      className:
        'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-900',
      icon: <Globe class="size-3 shrink-0" />,
      tooltip: isPlatformInvite() ? t('New User') : t('New Member'),
    };
  };

  const handleSelectUser = (email: string) => {
    props.onInput([...props.value, email]);
    setInputValue('');
    setSelectedValue('');
    setTagInputKey((prev) => prev + 1);
    requestAnimationFrame(() => inputRef?.focus());
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isOpen()) {
        e.stopImmediatePropagation();
        setShowSuggestions(false);
        setSelectedValue('');
      }
      props.onOpenChange?.(false);
      return;
    }
    if (
      e.key === 'Enter' &&
      selectedValue() &&
      showSuggestions() &&
      hasSuggestions()
    ) {
      e.preventDefault();
      const email = selectableItems().find(
        (item) => item.toLowerCase() === selectedValue(),
      );
      if (email) handleSelectUser(email);
    }
  };

  const handleInputChange = (v: string) => {
    setInputValue(v);
    setSelectedValue('');
  };

  const isOpen = () => showSuggestions() && hasSuggestions();

  return (
    <Command
      shouldFilter={false}
      value={selectedValue()}
      onValueChange={setSelectedValue}
      class="overflow-visible bg-transparent rounded-none h-auto"
    >
      <div class="relative">
        <TagInput
          key={tagInputKey()}
          ref={inputRef}
          value={props.value}
          onInput={props.onInput}
          type="email"
          showDescription={false}
          getTagMeta={getTagMeta}
          placeholder={props.placeholder}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setShowSuggestions(true);
            setSelectedValue('');
            props.onOpenChange?.(true);
          }}
          onBlur={() => {
            setShowSuggestions(false);
            setSelectedValue('');
            props.onOpenChange?.(false);
          }}
        />
        <Show when={isOpen()}>
          <div
            class="absolute top-full left-0 w-full z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden"
            onMouseDown={(e) => e.preventDefault()}
          >
            <CommandList class="max-h-none overflow-y-hidden">
              <ScrollArea viewPortClassName="max-h-[200px]">
                <CommandGroup heading={t('Suggestions')}>
                  <For each={suggestedUsers()}>
                    {(user) => (
                      <SuggestedUserItem
                        key={user.id}
                        type="platform-user"
                        user={user}
                        onSelect={handleSelectUser}
                      />
                    )}
                  </For>
                  <Show when={emailStatus()}>
                    {(status) => (
                      <SuggestedUserItem
                        type="email-status"
                        emailStatus={status()}
                        isPlatformInvite={isPlatformInvite()}
                        onSelect={handleSelectUser}
                      />
                    )}
                  </Show>
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </div>
        </Show>
      </div>
      <p class="text-xs text-muted-foreground mt-2">
        {t('Separate email addresses with a space or comma.')}
      </p>
    </Command>
  );
}

type UserSuggestionsPopoverProps = {
  value: ReadonlyArray<string>;
  onInput: (emails: ReadonlyArray<string>) => void;
  placeholder?: string;
  invitationType: InvitationType;
  onOpenChange?: (open: boolean) => void;
};

export { UserSuggestionsPopover };
