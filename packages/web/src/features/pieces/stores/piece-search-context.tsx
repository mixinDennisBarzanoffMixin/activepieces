import { createContext, createSignal, useContext } from 'solid-js';

export type PieceSearchContextState = {
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
};

const PieceSearchContext = createContext<PieceSearchContextState>({
  searchQuery: '',
  setSearchQuery: () => {},
});

export const PieceSearchProvider = ({ children }: { children }) => {
  const [searchQuery, setSearchQuery] = createSignal('');
  return (
    <PieceSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </PieceSearchContext.Provider>
  );
};

export const usePieceSearchContext = () => useContext(PieceSearchContext);
