import { flowStructureUtil, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Database, SearchXIcon, Variable } from 'lucide-solid';
import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';

import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';
import { SearchInput } from '@/components/custom/search-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { BuilderState, useBuilderStateContext } from '../builder-hooks';

import { DataSelectorNode } from './data-selector-node';
import {
  DataSelectorSizeState,
  DataSelectorSizeTogglers,
} from './data-selector-size-togglers';
import { DataSelectorTreeNode } from './type';
import { dataSelectorUtils } from './utils';
import { VariablesTab } from './variables-tab';

const buildDataSelectorStructure = (
  state: BuilderState,
): DataSelectorTreeNode[] => {
  const { selectedStep, flowVersion } = state;
  if (!selectedStep || !flowVersion || !flowVersion.trigger) {
    return [];
  }
  const pathToTargetStep = flowStructureUtil.findPathToStep(
    flowVersion.trigger,
    selectedStep,
  );
  return pathToTargetStep.map((step) => {
    try {
      return dataSelectorUtils.traverseStep(
        step,
        state.outputSampleData,
        state.isFocusInsideListMapperModeInput,
      );
    } catch (error) {
      console.error('Failed to traverse step:', error);
      return {
        key: `error-${step.name}`,
        data: {
          type: 'chunk',
          displayName: `Error loading ${step.name}`,
        },
      };
    }
  });
};

type DataSelectorProps = {
  parentHeight: number;
  parentWidth: number;
};

const doesElementHaveAnInputThatUsesMentions = (
  element: Element | null,
): boolean => {
  if (isNil(element)) {
    return false;
  }
  if (element.classList.contains(textMentionUtils.inputWithMentionsCssClass)) {
    return true;
  }
  const parent = element.parentElement;
  if (parent) {
    return parent && doesElementHaveAnInputThatUsesMentions(parent);
  }
  return false;
};

const DataSelector = (props: DataSelectorProps) => {
  let containerRef: HTMLDivElement | undefined;
  const [DataSelectorSize, setDataSelectorSize] =
    createSignal<DataSelectorSizeState>(DataSelectorSizeState.DOCKED);
  const [searchTerm, setSearchTerm] = createSignal('');
  const dataSelectorStructure = useBuilderStateContext(
    buildDataSelectorStructure,
  );
  const filteredNodes = createMemo(() =>
    dataSelectorUtils.filterBy(dataSelectorStructure, searchTerm()),
  );
  const [showDataSelector, setShowDataSelector] = createSignal(false);
  const state = useBuilderStateContext((state) => ({
    isTriggerSelected: state.selectedStep === 'trigger',
  }));
  const defaultTab = state.isTriggerSelected ? 'variables' : 'data';

  const checkFocus = () => {
    const isTextMentionInputFocused =
      (!isNil(containerRef) && containerRef.contains(document.activeElement)) ||
      doesElementHaveAnInputThatUsesMentions(document.activeElement);
    setShowDataSelector(isTextMentionInputFocused);
  };

  createEffect(() => {
    document.addEventListener('focusin', checkFocus);
    document.addEventListener('focusout', checkFocus);

    return () => {
      document.removeEventListener('focusin', checkFocus);
      document.removeEventListener('focusout', checkFocus);
    };
  });

  return (
    <div
      ref={(el) => (containerRef = el)}
      tabIndex={0}
      class={cn(
        'absolute bottom-0 mr-5 mb-5 right-0 z-50 transition-all  border border-solid border-outline overflow-x-hidden bg-background shadow-lg rounded-md',
        {
          'opacity-0 pointer-events-none': !showDataSelector(),
        },
        textMentionUtils.dataSelectorCssClassSelector,
      )}
    >
      <div class="text-lg items-center px-3 py-2 flex gap-2">
        {t('Data Selector')} <div class="grow" />{' '}
        <DataSelectorSizeTogglers
          state={DataSelectorSize}
          setListSizeState={setDataSelectorSize}
        />
      </div>
      <div
        style={{
          height:
            DataSelectorSize() === DataSelectorSizeState.COLLAPSED
              ? '0px'
              : DataSelectorSize() === DataSelectorSizeState.DOCKED
              ? '450px'
              : `${props.parentHeight - 100}px`,
          width:
            DataSelectorSize() !== DataSelectorSizeState.EXPANDED
              ? '450px'
              : `${props.parentWidth - 40}px`,
        }}
        class="transition-all overflow-hidden"
      >
        <Tabs
          key={defaultTab}
          defaultValue={defaultTab}
          class="h-full flex flex-col gap-0"
        >
          <TabsList
            variant="outline"
            class="px-3 shrink-0 gap-1 border-b border-border w-full justify-start"
          >
            <TabsTrigger
              value="data"
              variant="outline"
              class="gap-2 px-3 py-2 hover:text-foreground rounded-none"
            >
              <Database class="w-4 h-4" />
              {t('Data')}
            </TabsTrigger>
            <TabsTrigger
              value="variables"
              variant="outline"
              class="gap-2 px-3 py-2 hover:text-foreground rounded-none"
            >
              <Variable class="w-4 h-4" />
              {t('Variables')}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="data"
            class="flex-1 min-h-0 flex flex-col gap-2 mt-2"
          >
            <div class="flex items-center gap-2 px-5">
              <SearchInput
                onChange={(e) => setSearchTerm(e)}
                value={searchTerm()}
              />
            </div>
            <ScrollArea class="transition-all flex-1 w-full ">
              <Show when={filteredNodes()}>
                <For each={filteredNodes()}>
                  {(node) => (
                    <DataSelectorNode
                      depth={0}
                      key={node.key}
                      node={node}
                      searchTerm={searchTerm()}
                    />
                  )}
                </For>
              </Show>
              <Show when={filteredNodes().length === 0}>
                <div class="flex items-center justify-center gap-2 mt-5  flex-col">
                  <SearchXIcon class="w-[35px] h-[35px]" />
                  <div class="text-center font-semibold text-md">
                    {t('No matching data')}
                  </div>
                  <div class="text-center ">
                    {t('Try adjusting your search')}
                  </div>
                </div>
              </Show>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="variables" class="flex-1 min-h-0 mt-2">
            <VariablesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export { DataSelector };
