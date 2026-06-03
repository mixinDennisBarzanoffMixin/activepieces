import { createContext, createSignal, useContext } from 'solid-js';

import { StepMetadataWithSuggestions } from '@/features/pieces/types';

export enum PieceSelectorTabType {
  EXPLORE = 'EXPLORE',
  AI_AND_AGENTS = 'AI_AND_AGENTS',
  APPROVALS = 'APPROVALS',
  APPS = 'APPS',
  UTILITY = 'UTILITY',
  NONE = 'NONE',
}

export const PieceSelectorTabsContext = createContext({
  selectedTab: PieceSelectorTabType.EXPLORE,
  setSelectedTab: (_tab: PieceSelectorTabType) => {},
  resetToBeforeNoneWasSelected: () => {},
  setSelectedPieceInExplore: (_piece: StepMetadataWithSuggestions | null) => {},
  selectedPieceInExplore: null as null | StepMetadataWithSuggestions,
});

export const PieceSelectorTabsProvider = (props: {
  children;
  onTabChange: (tab: PieceSelectorTabType) => void;
  initiallySelectedTab: PieceSelectorTabType;
}) => {
  const [selectedTab, setSelectedTab] = createSignal(
    props.initiallySelectedTab,
  );
  const [lastTabBefroeNoneWasSelected, setLastTabBeforeNoneWasSelected] =
    createSignal(props.initiallySelectedTab);
  const [selectedPieceInExplore, setSelectedPieceInExplore] =
    createSignal<StepMetadataWithSuggestions | null>(null);
  return (
    <PieceSelectorTabsContext.Provider
      value={{
        selectedTab,
        setSelectedPieceInExplore,
        selectedPieceInExplore,
        setSelectedTab: (tab: PieceSelectorTabType) => {
          if (tab !== PieceSelectorTabType.NONE) {
            setLastTabBeforeNoneWasSelected(tab);
            props.onTabChange(tab);
          }
          setSelectedTab(tab);
        },
        resetToBeforeNoneWasSelected: () => {
          setSelectedTab(lastTabBefroeNoneWasSelected);
        },
      }}
    >
      {props.children}
    </PieceSelectorTabsContext.Provider>
  );
};

export const usePieceSelectorTabs = () => {
  const context = useContext(PieceSelectorTabsContext);
  if (!context) {
    throw new Error(
      'usePieceSelectorTabs must be used within a PieceSelectorTabsProvider',
    );
  }
  return context;
};
