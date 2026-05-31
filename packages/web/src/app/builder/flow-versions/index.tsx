import { t } from 'i18next';
import { For, Show } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { RightSideBarType } from '@/app/builder/types';
import { CardList, CardListItemSkeleton } from '@/components/custom/card-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flowHooks } from '@/features/flows';

import { SidebarHeader } from '../sidebar-header';

import { FlowVersionDetailsCard } from './flow-versions-card';

const FlowVersionsList = () => {
  const [flow, setRightSidebar, selectedFlowVersion] = useBuilderStateContext(
    (state) => [state.flow, state.setRightSidebar, state.flowVersion],
  );

  const {
    data: flowVersionPage,
    isLoading,
    isError,
  } = flowHooks.useListFlowVersions(flow.id);

  return (
    <>
      <SidebarHeader onClose={() => setRightSidebar(RightSideBarType.NONE)}>
        {t('Version History')}
      </SidebarHeader>
      <CardList>
        <Show when={isLoading()}>
          <CardListItemSkeleton numberOfCards={10} />
        </Show>
        <Show when={isError()}>
          <div>{t('Error, please try again.')}</div>
        </Show>
        <Show when={flowVersionPage && flowVersionPage.data()}>
          <ScrollArea class="w-full h-full">
            <For each={flowVersionPage.data}>
              {(flowVersion, index) => (
                <FlowVersionDetailsCard
                  selected={flowVersion.id === selectedFlowVersion?.id}
                  publishedVersionId={flow.publishedVersionId}
                  flowVersion={flowVersion}
                  flowVersionNumber={flowVersionPage.data.length - index}
                  key={flowVersion.id}
                />
              )}
            </For>
          </ScrollArea>
        </Show>
      </CardList>
    </>
  );
};

FlowVersionsList.displayName = 'FlowVersionsList';

export { FlowVersionsList };
