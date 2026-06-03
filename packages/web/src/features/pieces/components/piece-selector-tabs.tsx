import { For } from 'solid-js';

import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';

import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '../stores/piece-selector-tabs-provider';

type TabType = {
  value: PieceSelectorTabType;
  name: string;
  icon;
};

export const PieceSelectorTabs = (props: { tabs: TabType[] }) => {
  const { selectedTab, setSelectedTab } = usePieceSelectorTabs();
  return (
    <Tabs
      value={selectedTab}
      onValueChange={(value) => setSelectedTab(value as PieceSelectorTabType)}
      class="w-full"
    >
      <TabsList
        class={`h-full w-full flex gap-3 px-2  justify-start rounded-none bg-background`}
        style={{
          'grid-template-columns': `repeat(${props.tabs.length}, minmax(0, 1fr))`,
        }}
      >
        <For each={props.tabs}>
          {(tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              class={`flex flex-col  grow  h-full rounded-md  w-[85px] max-w-[85px] shrink-0
              hover:bg-gray-300/30 dark:hover:bg-gray-300/10
               data-[state=active]:text-primary data-[state=active]:shadow-none
               border-transparent data-[state=active]:border-primary data-[state=active]:active data-[state=active]:bg-transparent
               text-accent-foreground [&>svg]:size-5 [&>svg]:shrink-0`}
            >
              {tab.icon}
              <span class="mt-1.5 text-sm">{tab.name}</span>
            </TabsTrigger>
          )}
        </For>
      </TabsList>
    </Tabs>
  );
};
