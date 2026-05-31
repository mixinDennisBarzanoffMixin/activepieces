import { ApFlagId, supportUrl } from '@activepieces/shared';
import { t } from 'i18next';
import { BookOpen, CircleHelp, History } from 'lucide-solid';
import { Show } from 'solid-js';

import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { flagsHooks } from '@/hooks/flags-hooks';

export const HelpAndFeedback = () => {
  const { data: showCommunity } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger class="flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm cursor-pointer">
        <CircleHelp class="w-4 h-4 mr-2" />
        {t('Help & Feedback')}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent class="w-[220px]">
        <DropdownMenuItem asChild>
          <a
            href="https://activepieces.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            class="flex justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <BookOpen class="size-4" />
              <span>Documentation</span>
            </div>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href="https://github.com/activepieces/activepieces/releases"
            target="_blank"
            rel="noopener noreferrer"
            class="flex justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <History class="size-4" />
              <span>{t('Changelog')}</span>
            </div>
          </a>
        </DropdownMenuItem>

        {
          <Show when={showCommunity}>
            <>
              <div className="flex text-xs text-muted-foreground items-center gap-2 px-2 py-1">
                <span>Need Help?</span>
              </div>
              <DropdownMenuItem asChild>
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <CircleHelp class="size-4" />
                    <span>{t('Community Support')}</span>
                  </div>
                </a>
              </DropdownMenuItem>
            </>
          </Show>
        }
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
