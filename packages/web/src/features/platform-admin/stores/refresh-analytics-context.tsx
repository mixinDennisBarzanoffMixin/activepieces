import { Accessor, createSignal, createContext, JSX } from 'solid-js';

type TimeSavedOverride = {
  value: number | null;
};

type RefreshAnalyticsContextType = {
  isRefreshing: Accessor<boolean>;
  setIsRefreshing: (isRefreshing: boolean) => void;
  timeSavedPerRunOverrides: Accessor<Record<string, TimeSavedOverride>>;
  setTimeSavedPerRunOverride: (flowId: string, value: number | null) => void;
  clearTimeSavedPerRunOverrides: () => void;
};

export const RefreshAnalyticsContext =
  createContext<RefreshAnalyticsContextType>({
    isRefreshing: () => false,
    setIsRefreshing: () => {},
    timeSavedPerRunOverrides: () => ({}),
    setTimeSavedPerRunOverride: () => {},
    clearTimeSavedPerRunOverrides: () => {},
  });

export const RefreshAnalyticsProvider = (props: { children: JSX.Element }) => {
  const [isRefreshing, setIsRefreshing] = createSignal(false);
  const [timeSavedPerRunOverrides, setTimeSavedPerRunOverrides] = createSignal<
    Record<string, TimeSavedOverride>
  >({});

  const setTimeSavedPerRunOverride = (flowId: string, value: number | null) => {
    setTimeSavedPerRunOverrides((state) => ({ ...state, [flowId]: { value } }));
  };

  const clearTimeSavedPerRunOverrides = () => {
    setTimeSavedPerRunOverrides({});
  };

  return (
    <RefreshAnalyticsContext.Provider
      value={{
        isRefreshing,
        setIsRefreshing,
        timeSavedPerRunOverrides,
        setTimeSavedPerRunOverride,
        clearTimeSavedPerRunOverrides,
      }}
    >
      {props.children}
    </RefreshAnalyticsContext.Provider>
  );
};
