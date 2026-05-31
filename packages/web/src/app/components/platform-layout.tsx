import { ApEdition, ApFlagId } from '@activepieces/shared';
import { Show } from 'solid-js';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { GlobalSearchProvider } from './global-search/global-search-context';
import { PlatformSidebar } from './sidebar/platform';

export function PlatformLayout({ children }: { children: JSX.Element }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const showPlatformAdminDashboard = useIsPlatformAdmin();

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <GlobalSearchProvider>
        {
          <Show
            when={showPlatformAdminDashboard}
            fallback={<Redirect to="/" />}
          >
            <SidebarProvider open={true}>
              <PlatformSidebar />
              <SidebarInset class="flex flex-col h-full overflow-hidden bg-sidebar">
                <div className="flex-1 flex flex-col p-2 pt-3 pb-3 overflow-hidden">
                  <div
                    id="dashboard-content-container"
                    className="relative flex flex-col h-full bg-background rounded-xl shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border overflow-clip"
                  >
                    <div className="flex flex-col flex-1 overflow-auto">
                      {children}
                    </div>
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </Show>
        }
        {
          <Show when={edition === ApEdition.CLOUD}>
            <PurchaseExtraFlowsDialog />
          </Show>
        }
      </GlobalSearchProvider>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}

function Redirect({ to }: { to: string }) {
  window.location.replace(to);
  return null;
}
