import {
  FlowRun,
  isFlowRunStateTerminal,
  SeekPage,
} from '@activepieces/shared';
import { InfiniteData, createInfiniteQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Show, createMemo } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { RightSideBarType } from '@/app/builder/types';
import {
  CardListEmpty,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { Button } from '@/components/ui/button';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { flowRunsApi } from '@/features/flow-runs';
import { authenticationSession } from '@/lib/authentication-session';

import { SidebarHeader } from '../sidebar-header';

import { FLOW_CARD_HEIGHT, FlowRunCard } from './flow-run-card';

type RunsListItem =
  | { type: 'flowRun'; run: FlowRun }
  | { type: 'loadMoreButton'; id: 'loadMoreButton' };
const RunsList = () => {
  const [flow, setRightSidebar, run] = useBuilderStateContext((state) => [
    state.flow,
    state.setRightSidebar,
    state.run,
  ]);

  const query = createInfiniteQuery<
    SeekPage<FlowRun>,
    Error,
    InfiniteData<SeekPage<FlowRun>>,
    [string, string],
    string | undefined
  >(() => ({
    queryKey: ['flow-runs', flow.id],
    getNextPageParam: (lastPage) => lastPage.next,
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      flowRunsApi.list({
        flowId: [flow.id],
        projectId: authenticationSession.getProjectId()!,
        limit: 15,
        cursor: pageParam,
      }),
    refetchOnMount: true,
    staleTime: 0,
    refetchInterval: (query) => {
      const allRuns = query.state.data?.pages.flatMap((page) => page.data);
      const runningRuns = allRuns?.filter(
        (run) =>
          !isFlowRunStateTerminal({
            status: run.status,
            ignoreInternalError: false,
          }),
      );
      return runningRuns?.length ? 15 * 1000 : false;
    },
  }));

  const allViewedRuns = createMemo<RunsListItem[]>(() => {
    if (!query.data) return [];
    const allRuns: RunsListItem[] = query.data.pages
      .flatMap((page) => page.data)
      .map((run) => ({ type: 'flowRun', run }));
    if (query.hasNextPage) {
      return [...allRuns, { type: 'loadMoreButton', id: 'loadMoreButton' }];
    }
    return allRuns;
  });

  return (
    <div class="h-full w-full flex flex-col">
      <SidebarHeader onClose={() => setRightSidebar(RightSideBarType.NONE)}>
        {t('Recent Runs')}
      </SidebarHeader>
      <Show when={query.isLoading}>
        <CardListItemSkeleton numberOfCards={10} />
      </Show>

      <Show when={query.isError}>
        <div>{t('Error, please try again.')}</div>
      </Show>

      <Show
        when={
          query.data &&
          query.data.pages.flatMap((page) => page.data).length === 0 &&
          !query.isRefetching
        }
      >
        <CardListEmpty message={t('No runs found')} />
      </Show>

      <Show
        when={
          query.data && query.data.pages.flatMap((page) => page.data).length > 0
        }
      >
        <VirtualizedScrollArea
          class="w-full grow max-w-[calc(100%-6px)]"
          items={allViewedRuns()}
          estimateSize={() => FLOW_CARD_HEIGHT}
          getItemKey={(index) => index}
          renderItem={(item) => {
            if (item.type === 'flowRun') {
              return (
                <FlowRunCard
                  refetchRuns={() => {
                    void query.refetch();
                  }}
                  run={item.run}
                  key={item.run.id + item.run.status}
                  viewedRunId={run?.id}
                />
              );
            }
            return (
              <div class="mx-5 h-full flex items-center ">
                <Button
                  class="w-full"
                  variant={'accent'}
                  onClick={() => void query.fetchNextPage()}
                  loading={query.isFetchingNextPage}
                >
                  {t('More...')}
                </Button>
              </div>
            );
          }}
        />
      </Show>
    </div>
  );
};

export { RunsList };
