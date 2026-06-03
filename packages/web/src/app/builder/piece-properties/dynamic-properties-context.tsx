import { createContext, createMemo, createSignal } from 'solid-js';

export const DynamicPropertiesContext = createContext<{
  propertiesNamesStillLoading: string[];
  propertyLoadingFinished: (propertyName: string) => void;
  propertyLoadingStarted: (propertyName: string) => void;
  isLoadingDynamicProperties: boolean;
}>({
  propertiesNamesStillLoading: [],
  propertyLoadingFinished: (_propertyName: string) => {},
  propertyLoadingStarted: (_propertyName: string) => {},
  isLoadingDynamicProperties: false,
});

export const DynamicPropertiesProvider = (props: { children: any }) => {
  const [propertiesNamesStillLoading, setPropertiesNamesStillLoading] =
    createSignal<string[]>([]);

  const propertyLoadingFinished = (propertyName: string) => {
    setPropertiesNamesStillLoading((prev) =>
      prev.filter((name) => name !== propertyName),
    );
  };

  const propertyLoadingStarted = (propertyName: string) => {
    setPropertiesNamesStillLoading((prev) => [...prev, propertyName]);
  };

  const isLoadingDynamicProperties = createMemo(
    () => propertiesNamesStillLoading().length > 0,
  );

  const contextValue = createMemo(() => ({
    propertiesNamesStillLoading: propertiesNamesStillLoading(),
    propertyLoadingFinished,
    propertyLoadingStarted,
    isLoadingDynamicProperties: isLoadingDynamicProperties(),
  }));

  return (
    <DynamicPropertiesContext.Provider value={contextValue()}>
      {props.children}
    </DynamicPropertiesContext.Provider>
  );
};
