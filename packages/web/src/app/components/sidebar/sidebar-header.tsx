import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronsUpDown } from 'lucide-solid';
import { Show } from 'solid-js';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { PlatformSwitcher } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { determineDefaultRoute } from '@/lib/route-utils';

function SidebarLogoCollapsed(props: { linkTo?: string }) {
  const branding = flagsHooks.useWebsiteBranding();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => (window.location.href = props.linkTo || '/')}
      class="h-10! w-8! p-0! group-data-[collapsible=icon]:h-10! items-center justify-center"
    >
      <img
        src={branding()?.logos.logoIconUrl}
        alt={t('home')}
        class="h-5! w-5! shrink-0"
        draggable={false}
      />
    </Button>
  );
}

export const AppSidebarHeader = () => {
  const { embedState } = useEmbedding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const showSwitcher = edition === ApEdition.CLOUD && !embedState.isEmbedded;
  const { state } = useSidebar();
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);
  const branding = flagsHooks.useWebsiteBranding();

  if (!showSwitcher) {
    return (
      <SidebarHeader class="pb-0">
        <div class="w-full flex items-center gap-2">
          <SidebarLogoCollapsed linkTo={defaultRoute} />
          {
            <Show when={state !== 'collapsed'}>
              <h1 class="truncate text-sm font-medium">
                {branding()?.websiteName}
              </h1>
            </Show>
          }
        </div>
      </SidebarHeader>
    );
  }

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem class="flex items-center">
          <SidebarLogoCollapsed linkTo={defaultRoute} />
          {
            <Show when={state !== 'collapsed'}>
              <div class="flex-1 min-w-0">
                <PlatformSwitcher>
                  <SidebarMenuButton class="h-10! w-full">
                    <span class="truncate font-medium flex-1 text-left text-sm">
                      {currentPlatform?.name ?? t('platform')}
                    </span>
                    <ChevronsUpDown class="ml-auto size-3! shrink-0" />
                  </SidebarMenuButton>
                </PlatformSwitcher>
              </div>
            </Show>
          }
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};
