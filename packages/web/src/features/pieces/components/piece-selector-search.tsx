import { t } from 'i18next';
import { ArrowLeftIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { usePieceSearchContext } from '@/features/pieces/stores/piece-search-context';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '@/features/pieces/stores/piece-selector-tabs-provider';

type PiecesSearchInputProps = {
  searchInputRef: HTMLInputElement | undefined;
  onSearchChange: (query: string) => void;
};

const PiecesSearchInput = (props: PiecesSearchInputProps) => {
  const { searchQuery, setSearchQuery } = usePieceSearchContext();
  const {
    resetToBeforeNoneWasSelected: resetToPreviousValue,
    setSelectedTab,
    selectedPieceInExplore,
    selectedTab,
    setSelectedPieceInExplore,
  } = usePieceSelectorTabs();
  const showBackButton =
    selectedPieceInExplore && selectedTab === PieceSelectorTabType.EXPLORE;
  return (
    <div class="p-2 flex gap-2 items-center">
      <Show when={showBackButton}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedPieceInExplore(null);
          }}
        >
          <ArrowLeftIcon class="size-4" />
        </Button>
      </Show>
      <SearchInput
        placeholder={String(t('Search'))}
        value={searchQuery}
        data-testid="pieces-search-input"
        ref={props.searchInputRef}
        onInput={(e) => {
          setSearchQuery(e);
          props.onSearchChange(e);
          if (e === '') {
            resetToPreviousValue();
          } else {
            setSelectedTab(PieceSelectorTabType.NONE);
          }
        }}
      />
    </div>
  );
};
export { PiecesSearchInput };
