import { InvitationType } from '@activepieces/shared';
import { t } from 'i18next';
import { Globe, UserCheck } from 'lucide-solid';
import { createSignal } from 'solid-js';

import { TagInput, TagMeta } from '@/components/custom/tag-input';
import { Command, CommandGroup, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatUtils } from '@/lib/format-utils';

import { SuggestedUserItem } from './suggested-user-item';
import { useUserSuggestions } from './use-user-suggestions';

function UserSuggestionsPopover({
  value,
  onChange,
  placeholder,
  invitationType,
  onOpenChange,
}: UserSuggestionsPopoverProps) {
  const [inputValue, setInputValue] = createSignal('');
  const [showSuggestions, setShowSuggestions] = createSignal(false);
  const [selectedValue, setSelectedValue] = createSignal('');
  const [tagInputKey, setTagInputKey] = createSignal(0);
  let inputRef: HTMLInputElement | undefined;
  const isPlatformInvite = invitationType === InvitationType.PLATFORM;

  const {
    suggestedUsers,
    emailStatus,
    hasSuggestions,
    selectableItems,
    platformUserEmails,
  } = useUserSuggestions({
    inputValue: inputValue(),
    currentEmails: Array.from(value),
    isPlatformInvite,
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
        tooltip: isPlatformInvite ? t('New User') : t('New Member'),
      };
  };

  const handleSelectUser = (email: string) => {
    onChange([...value, email]);
    setInputValue('');
    setSelectedValue('');
    setTagInputKey((prev) => prev + 1);
    requestAnimationFrame(() => inputRef?.focus());
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isOpen) {
        e.nativeEvent.stopImmediatePropagation();
        setShowSuggestions(false);
        setSelectedValue('');
      }
      onOpenChange?.(false);
      return;
    }
    if (
      e.key === 'Enter' &&
      selectedValue() &&
      showSuggestions() &&
      hasSuggestions
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

  const isOpen = () => showSuggestions() && hasSuggestions;

  return (
    <Command
      shouldFilter={false}
      value={selectedValue()}
      onValueChange={setSelectedValue}
      class="overflow-visible bg-transparent rounded-none h-auto"
    >
      <div className="relative">
        <TagInput
          key={tagInputKey()}
          ref={inputRef}
          value={value}
          onChange={onChange}
          type="email"
          showDescription={false}
          getTagMeta={getTagMeta}
          placeholder={placeholder}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setShowSuggestions(true);
            setSelectedValue('');
            onOpenChange?.(true);
          }}
          onBlur={() => {
            setShowSuggestions(false);
            setSelectedValue('');
            onOpenChange?.(false);
          }}
        />
        {isOpen() && (
          <div
            className="absolute top-full left-0 w-full z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden"
            onMouseDown={(e) => e.preventDefault()}
          >
            <CommandList class="max-h-none overflow-y-hidden">
              <ScrollArea viewPortClassName="max-h-[200px]">
                <CommandGroup heading={t('Suggestions')}>
                  {suggestedUsers().map((user) => (
                    <SuggestedUserItem
                      key={user.id}
                      type="platform-user"
                      user={user}
                      onSelect={handleSelectUser}
                    />
                  ))}
                  {emailStatus() && (
                    <SuggestedUserItem
                      type="email-status"
                      emailStatus={emailStatus()!}
                      isPlatformInvite={isPlatformInvite}
                      onSelect={handleSelectUser}
                    />
                  )}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {t('Separate email addresses with a space or comma.')}
      </p>
    </Command>
  );
}

type UserSuggestionsPopoverProps = {
  value: ReadonlyArray<string>;
  onChange: (emails: ReadonlyArray<string>) => void;
  placeholder?: string;
  invitationType: InvitationType;
  onOpenChange?: (open: boolean) => void;
};

export { UserSuggestionsPopover };
