import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Plus } from 'lucide-solid';
import { createSignal, createMemo, JSX } from 'solid-js';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { projectHooks } from '@/features/projects/stores/project-collection';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { platformHooks } from '../../../hooks/platform-hooks';

import { CreatePlatformDialog } from './create-platform-dialog';

export function PlatformSwitcher({ children }: { children: JSX.Element }) {
  const { data: allProjects } = projectHooks.useProjectsForPlatforms();
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const [createDialogOpen, setCreateDialogOpen] = createSignal(false);
  const isCloud = edition === ApEdition.CLOUD;

  const platforms = createMemo(() => {
    if (!allProjects) return [];
    return allProjects.map((platform) => ({
      name: platform.platformName,
      id: platform.projects[0]?.platformId,
    }));
  }, [allProjects]);

  const handlePlatformSwitch = async (platformId: string) => {
    await authenticationSession.switchToPlatform(platformId);
  };

  const dropdownContent = (
    <DropdownMenuContent
      class="w-56 rounded-lg z-60"
      align="start"
      side="right"
      sideOffset={4}
    >
      <div className="px-2 py-1.5">
        <p className="text-xs text-muted-foreground">{t('Platforms')}</p>
      </div>
      <ScrollArea viewPortClassName="max-h-[400px]">
        {platforms.map((platform) => (
          <DropdownMenuItem
            key={platform.id}
            onClick={() => handlePlatformSwitch(platform.id)}
            class="text-sm p-2 break-all cursor-pointer"
          >
            {platform.name}
            <Check
              class={cn(
                'ml-auto h-4 w-4 shrink-0',
                currentPlatform?.id === platform.id
                  ? 'opacity-100'
                  : 'opacity-0',
              )}
            />
          </DropdownMenuItem>
        ))}
      </ScrollArea>
      {isCloud && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateDialogOpen(true)}
            class="text-sm p-2 cursor-pointer"
          >
            <Plus class="mr-2 h-4 w-4" />
            {t('Create Platform')}
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild class="w-full">
          {children}
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
      {isCloud && (
        <CreatePlatformDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}
    </>
  );
}
