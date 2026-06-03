import { ApFlagId } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import i18n, { t } from 'i18next';
import { Check, ChevronsUpDown, Globe } from 'lucide-solid';
import { createSignal, Show, For } from 'solid-js';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flagsHooks } from '@/hooks/flags-hooks';
import { localesMap } from '@/lib/locale-utils';
import { cn } from '@/lib/utils';

export const LanguageToggle = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const { data: showCommunity } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const [selectedLanguage, setSelectedLanguage] = createSignal(
    Object.entries(localesMap).find(([value]) => value === i18n.language)?.[0],
  );

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: (value: string) => {
      setSelectedLanguage(value);
      return i18n.changeLanguage(value);
    },
    onSuccess: () => {
      setIsOpen(false);
    },
  }));
  const label = () => {
    const lang = selectedLanguage();
    if (!lang) return t('Select language');
    const item = Object.entries(localesMap).find(([value]) => value === lang);
    if (!item) throw new Error(`Unsupported language: ${lang}`);
    return item[1];
  };

  return (
    <div class="space-y-2">
      <Label class="text-sm font-medium flex items-center gap-2">
        <Globe class="w-4 h-4" />
        {t('Language')}
      </Label>
      <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            class={cn(
              'w-full justify-between font-normal',
              !selectedLanguage() && 'text-muted-foreground',
            )}
            disabled={isPending}
          >
            <Show when={isPending} fallback={label()}>
              <LoadingSpinner class="w-4 h-4" />
            </Show>
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={i18n.t('Search language...')}
              class="h-8 text-sm"
            />
            <CommandList>
              <ScrollArea class="h-[200px] w-[300px]">
                <CommandEmpty class="py-4 text-center text-sm">
                  {i18n.t('No language found.')}
                </CommandEmpty>
                <CommandGroup>
                  {
                    <For each={Object.entries(localesMap)}>
                      {([value, label]) => (
                        <CommandItem
                          value={value}
                          onSelect={(value) => mutate(value)}
                          class="flex items-center justify-between py-2 text-sm"
                        >
                          <div class="flex items-center gap-2">{label}</div>
                          <Check
                            class={cn(
                              'h-4 w-4',
                              value === selectedLanguage()
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      )}
                    </For>
                  }
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {
        <Show when={showCommunity}>
          <div class="pt-1">
            <a
              class="text-xs text-primary hover:underline font-medium"
              rel="noopener noreferrer"
              target="_blank"
              href="https://www.activepieces.com/docs/about/i18n"
            >
              {t('Help translate Activepieces →')}
            </a>
          </div>
        </Show>
      }
    </div>
  );
};

export default LanguageToggle;
