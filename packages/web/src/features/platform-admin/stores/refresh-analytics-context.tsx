import { createSignal, createContext, JSX } from 'solid-js';
import { createStore } from 'solid-js/store';

type TimeSavedOverride = {
  value: number | null;
};

type RefreshAnalyticsContextType = {
  isRefreshing: boolean;
  setIsRefreshing: (isRefreshing: boolean) => void;
  timeSavedPerRunOverrides: Record<string, TimeSavedOverride>;
  setTimeSavedPerRunOverride: (flowId: string, value: number | null) => void;
  clearTimeSavedPerRunOverrides: () => void;
};

export const RefreshAnalyticsContext =
  createContext<RefreshAnalyticsContextType>({
    isRefreshing: false,
    setIsRefreshing: () => {},
    timeSavedPerRunOverrides: {},
    setTimeSavedPerRunOverride: () => {},
    clearTimeSavedPerRunOverrides: () => {},
  });

export const RefreshAnalyticsProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const [isRefreshing, setIsRefreshing] = createSignal(false);
  const [timeSavedPerRunOverrides, setTimeSavedPerRunOverrides] = createStore<
    Record<string, TimeSavedOverride>
  >({});

  const setTimeSavedPerRunOverride = (flowId: string, value: number | null) => {
    setTimeSavedPerRunOverrides(flowId, { value });
  };

  const clearTimeSavedPerRunOverrides = () => {
    Object.keys(timeSavedPerRunOverrides).forEach((flowId) => {
      setTimeSavedPerRunOverrides(flowId, undefined!);
    });
  };

  return (
    <RefreshAnalyticsContext.Provider
      value={{
        isRefreshing: isRefreshing(),
        setIsRefreshing,
        timeSavedPerRunOverrides,
        setTimeSavedPerRunOverride,
        clearTimeSavedPerRunOverrides,
      }}
    >
      {children}
    </RefreshAnalyticsContext.Provider>
  );
};
