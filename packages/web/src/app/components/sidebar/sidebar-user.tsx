import { isNil } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { ChevronsUpDown, LogOut, UserCogIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import { UserAvatar } from '@/components/custom/user-avatar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import AccountSettingsDialog from '../account-settings';
import { HelpAndFeedback } from '../help-and-feedback';

export function SidebarUser() {
  const [accountSettingsOpen, setAccountSettingsOpen] = createSignal(false);
  const { embedState } = useEmbedding();
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const { reset } = useTelemetry();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  if (!user || embedState.isEmbedded) {
    return null;
  }

  const handleLogout = () => {
    userHooks.invalidateCurrentUser(queryClient);
    authenticationSession.logOut();
    reset();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal>
          <DropdownMenuTrigger asChild class="w-full">
            <SidebarMenuButton class="h-10! pl-2! group-data-[collapsible=icon]:h-10! group-data-[collapsible=icon]:pl-2!">
              <div className="size-[18px] shrink-0 overflow-hidden flex items-center justify-center rounded-full">
                <UserAvatar
                  class={cn('size-full object-cover', {
                    'scale-150': isNil(user.imageUrl),
                  })}
                  name={user.firstName + ' ' + user.lastName}
                  email={user.email}
                  imageUrl={user.imageUrl}
                  size={18}
                  disableTooltip={true}
                />
              </div>

              {
                <Show when={!isCollapsed}>
                  <>
                    <span className="truncate">
                      {user.firstName + ' ' + user.lastName}
                    </span>
                    <ChevronsUpDown class="ml-auto size-4" />
                  </>
                </Show>
              }
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg z-999"
            side="top"
            align="start"
            sideOffset={10}
          >
            <DropdownMenuLabel class="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="size-8 shrink-0 overflow-hidden rounded-full">
                  <UserAvatar
                    class="size-full object-cover"
                    name={user.firstName + ' ' + user.lastName}
                    email={user.email}
                    imageUrl={user.imageUrl}
                    size={32}
                    disableTooltip={true}
                  />
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.firstName + ' ' + user.lastName}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setAccountSettingsOpen(true)}>
                <UserCogIcon class="w-4 h-4 mr-2" />
                {t('Account Settings')}
              </DropdownMenuItem>

              <HelpAndFeedback />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut class="w-4 h-4 mr-2" />
              {t('Log out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <AccountSettingsDialog
        open={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </SidebarMenu>
  );
}
