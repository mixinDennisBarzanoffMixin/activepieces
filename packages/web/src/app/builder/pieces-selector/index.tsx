import {
  FlowOperationType,
  FlowTriggerType,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  CheckCircle2Icon,
  LayoutGridIcon,
  PuzzleIcon,
  SparklesIcon,
  WrenchIcon,
} from 'lucide-solid';
import { Show, createEffect, createMemo, mergeProps } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  PiecesSearchInput,
  PieceSelectorTabs,
  PieceSelectorTabsProvider,
  PieceSelectorTabType,
  PieceSelectorOperation,
  pieceSelectorUtils,
  PieceSearchProvider,
  usePieceSearchContext,
} from '@/features/pieces';
import { aiProviderQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/lib/debounce';

import { AITabContent } from './ai-tab-content';
import { ApprovalsTabContent } from './approvals-tab-content';
import { ExploreTabContent } from './explore-tab-content';
import { PiecesCardList } from './pieces-card-list';

const getTabsList = (
  operationType: FlowOperationType,
  agentsEnabled: boolean,
) => {
  const baseTabs = [
    {
      value: PieceSelectorTabType.EXPLORE,
      name: t('Explore'),
      icon: <LayoutGridIcon class="size-5" />,
    },
    {
      value: PieceSelectorTabType.APPS,
      name: t('Apps'),
      icon: <PuzzleIcon class="size-5" />,
    },
    {
      value: PieceSelectorTabType.UTILITY,
      name: t('Utility'),
      icon: <WrenchIcon class="size-5" />,
    },
  ];

  const replaceOrAddAction = [
    FlowOperationType.ADD_ACTION,
    FlowOperationType.UPDATE_ACTION,
  ].includes(operationType);

  if (replaceOrAddAction && agentsEnabled) {
    baseTabs.splice(1, 0, {
      value: PieceSelectorTabType.AI_AND_AGENTS,
      name: t('AI & Agents'),
      icon: <SparklesIcon class="size-5" />,
    });
  }
  if (replaceOrAddAction) {
    baseTabs.push({
      value: PieceSelectorTabType.APPROVALS,
      name: t('Approvals'),
      icon: <CheckCircle2Icon class="size-5" />,
    });
  }
  return baseTabs;
};

type PieceSelectorProps = {
  children: any;
  id: string;
  operation: PieceSelectorOperation;
  openSelectorOnClick?: boolean;
  stepToReplacePieceDisplayName?: string;
};

const PieceSelectorWrapper = (props: PieceSelectorProps) => {
  return (
    <PieceSearchProvider>
      <PieceSelectorContent {...props} />
    </PieceSearchProvider>
  );
};

const PieceSelectorContent = (_props: PieceSelectorProps) => {
  const props = mergeProps({ openSelectorOnClick: true }, _props);
  const [
    openedPieceSelectorStepNameOrAddButtonId,
    setOpenedPieceSelectorStepNameOrAddButtonId,
    setSelectedPieceMetadataInPieceSelector,
    trigger,
    deselectStep,
  ] = useBuilderStateContext((state) => [
    state.openedPieceSelectorStepNameOrAddButtonId,
    state.setOpenedPieceSelectorStepNameOrAddButtonId,
    state.setSelectedPieceMetadataInPieceSelector,
    state.flowVersion.trigger.type,
    state.deselectStep,
  ]);
  const { searchQuery, setSearchQuery } = usePieceSearchContext();
  const empty = createMemo(
    () => trigger === FlowTriggerType.EMPTY && props.id === 'trigger',
  );
  const replace = createMemo(
    () =>
      props.operation.type === FlowOperationType.UPDATE_ACTION ||
      (props.operation.type === FlowOperationType.UPDATE_TRIGGER && !empty()),
  );
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const open = createMemo(
    () => openedPieceSelectorStepNameOrAddButtonId === props.id,
  );
  const isMobile = useIsMobile();
  const { listHeightRef, popoverTriggerRef } =
    pieceSelectorUtils.useAdjustPieceListHeightToAvailableSpace();
  const listHeight = Math.min(listHeightRef.current, 300);
  let searchInputRef: HTMLInputElement | undefined;
  createEffect(() => {
    if (open()) {
      setTimeout(() => {
        searchInputRef?.focus();
      });
    }
  });
  const { data: aiProviders } = aiProviderQueries.useAiProviders();
  const clearSearch = () => {
    setSearchQuery('');
    setSelectedPieceMetadataInPieceSelector(null);
  };

  const { platform } = platformHooks.useCurrentPlatform();
  const tabs = createMemo(() =>
    getTabsList(
      props.operation.type,
      platform?.plan.agentsEnabled === true &&
        !isNil(aiProviders) &&
        aiProviders.length > 0,
    ),
  );

  return (
    <Popover
      open={open()}
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          clearSearch();
          setOpenedPieceSelectorStepNameOrAddButtonId(null);
          if (empty()) {
            deselectStep();
          }
        }
      }}
    >
      <PopoverTrigger
        ref={popoverTriggerRef}
        asChild={true}
        onClick={() => {
          if (props.openSelectorOnClick) {
            setOpenedPieceSelectorStepNameOrAddButtonId(props.id);
          }
        }}
      >
        {props.children}
      </PopoverTrigger>

      <PieceSelectorTabsProvider
        initiallySelectedTab={
          replace() || isMobile()
            ? PieceSelectorTabType.NONE
            : PieceSelectorTabType.EXPLORE
        }
        onTabChange={clearSearch}
        key={open() ? 'open' : 'closed'}
      >
        <PopoverContent
          onContextMenu={(e) => {
            e.stopPropagation();
          }}
          class="w-[340px] md:w-[600px] p-0 shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <>
            <div>
              <PiecesSearchInput
                searchInputRef={searchInputRef}
                onSearchChange={(e) => {
                  setSelectedPieceMetadataInPieceSelector(null);
                  if (e === '') {
                    clearSearch();
                  }
                }}
              />
              <Show when={!isMobile()}>
                <PieceSelectorTabs tabs={tabs()} />
              </Show>
              <Separator orientation="horizontal" class="mt-1" />
            </div>
            <div
              class=" flex flex-row max-h-[300px]"
              style={{
                height: listHeight + 'px',
              }}
            >
              <ExploreTabContent operation={props.operation} />
              <AITabContent operation={props.operation} />
              <ApprovalsTabContent operation={props.operation} />

              <PiecesCardList
                //this is done to avoid debounced results when user clears search
                searchQuery={searchQuery === '' ? '' : debouncedQuery}
                operation={props.operation}
                stepToReplacePieceDisplayName={
                  isMobile() ? undefined : props.stepToReplacePieceDisplayName
                }
              />
            </div>
          </>
        </PopoverContent>
      </PieceSelectorTabsProvider>
    </Popover>
  );
};

export { PieceSelectorWrapper as PieceSelector };
