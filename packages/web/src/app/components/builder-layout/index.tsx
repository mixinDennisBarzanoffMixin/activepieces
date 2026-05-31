import { ApEdition, ApFlagId } from '@activepieces/shared';
import { Show } from 'solid-js';

import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import {
  GlobalSearchProvider,
  useGlobalSearch,
} from '../global-search/global-search-context';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';

export function BuilderLayout({ children }: { children: JSX.Element }) {
  return (
    <GlobalSearchProvider>
      <BuilderLayoutInner>{children}</BuilderLayoutInner>
    </GlobalSearchProvider>
  );
}

function BuilderLayoutInner({ children }: { children: JSX.Element }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();
  const { open: searchOpen } = useGlobalSearch();

  return (
    <SidebarProvider hoverMode={!searchOpen} defaultOpen={false}>
      {
        <Show when={!embedState.isEmbedded}>
          <ProjectDashboardSidebar />
        </Show>
      }
      <SidebarInset class="flex flex-col h-full overflow-hidden bg-sidebar">
        <div
          className={cn(
            'flex-1 flex flex-col overflow-hidden',
            !embedState.isEmbedded && 'p-1.5',
          )}
        >
          <div
            className={cn(
              'flex flex-col h-full bg-background overflow-hidden',
              embedState.isEmbedded
                ? 'border-l'
                : 'rounded-xl shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border',
            )}
          >
            {children}
          </div>
        </div>
        {
          <Show when={edition === ApEdition.CLOUD}>
            <PurchaseExtraFlowsDialog />
          </Show>
        }
      </SidebarInset>
    </SidebarProvider>
  );
}
