import { createContext, useContext, createSignal, JSX } from 'solid-js';

type EmbeddingState = {
  isEmbedded: boolean;
  hideSideNav: boolean;
  hideFlowsPageNavbar: boolean;
  disableNavigationInBuilder: boolean;
  hideFolders: boolean;
  hideTables: boolean;
  hideFlowNameInBuilder: boolean;
  hideExportAndImportFlow: boolean;
  sdkVersion?: string;
  predefinedConnectionName?: string;
  fontUrl?: string;
  fontFamily?: string;
  useDarkBackground: boolean;
  hideHomeButtonInBuilder: boolean;
  emitHomeButtonClickedEvent: boolean;
  homeButtonIcon: 'back' | 'logo';
  hideDuplicateFlow: boolean;
  hidePageHeader: boolean;
};

const defaultState: EmbeddingState = {
  isEmbedded: false,
  hideSideNav: false,
  hideFlowsPageNavbar: false,
  disableNavigationInBuilder: false,
  hideFolders: false,
  hideTables: false,
  hideFlowNameInBuilder: false,
  hideExportAndImportFlow: false,
  useDarkBackground: window.opener !== null,
  hideHomeButtonInBuilder: false,
  emitHomeButtonClickedEvent: false,
  homeButtonIcon: 'logo',
  hideDuplicateFlow: false,
  hidePageHeader: false,
};

const EmbeddingContext = createContext<{
  embedState: EmbeddingState;
  setEmbedState: (
    value: EmbeddingState | ((prev: EmbeddingState) => EmbeddingState),
  ) => void;
}>({
  embedState: defaultState,
  setEmbedState: () => {},
});

export const useEmbedding = () => useContext(EmbeddingContext);

type EmbeddingProviderProps = {
  children: JSX.Element;
};

const EmbeddingProvider = (props: EmbeddingProviderProps) => {
  const [state, setState] = createSignal<EmbeddingState>(defaultState);

  return (
    <EmbeddingContext.Provider
      value={{ embedState: state(), setEmbedState: setState }}
    >
      <div
        classlist={{
          'bg-black/80 h-screen w-screen':
            state().useDarkBackground && state().isEmbedded,
        }}
      >
        {props.children}
      </div>
    </EmbeddingContext.Provider>
  );
};

export { EmbeddingProvider };
