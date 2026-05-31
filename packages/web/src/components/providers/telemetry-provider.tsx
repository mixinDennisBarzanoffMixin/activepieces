import {
  ApFlagId,
  isNil,
  TelemetryEvent,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { AnalyticsBrowser } from '@segment/analytics-next';
import posthog from 'posthog-js';
import { createEffect, createContext, useContext, JSX, createSignal } from 'solid-js';

import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';

interface TelemetryProviderProps {
  children: JSX.Element;
}

const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
  const { data: currentUser } = userHooks.useCurrentUser();
  const [analytics, setAnalytics] = createSignal<AnalyticsBrowser | null>(null);
  let initializedUserEmail: string | null = null;

  const [user, setUser] = createSignal<UserWithMetaInformation | null>(
    currentUser ?? null,
  );
  const { data: telemetryEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.TELEMETRY_ENABLED,
  );
  const { data: flagCurrentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: flagEnvironment } = flagsHooks.useFlag<string>(
    ApFlagId.ENVIRONMENT,
  );

  createEffect(() => {
    const handleStorageChange = (_event: StorageEvent) => {
      setUser(currentUser ?? null);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  createEffect(() => {
    if (isNil(user())) {
      return;
    }

    if (telemetryEnabled && user()?.email !== initializedUserEmail) {
      initTelemetry();
    }
  });

  const initTelemetry = () => {
    const current = user();
    if (isNil(current)) {
      return;
    }
    console.log('Telemetry enabled');
    const newAnalytics = AnalyticsBrowser.load({
      writeKey: 'Znobm6clOFLZNdMFpZ1ncf6VDmlCVSmj',
    });

    newAnalytics.addSourceMiddleware(({ payload, next }) => {
      const path = payload?.obj?.properties?.['path'];
      const ignoredPaths = ['/embed'];
      if (ignoredPaths.includes(path)) {
        return;
      }
      next(payload);
    });

    const currentVersion = flagCurrentVersion || '0.0.0';
    const environment = flagEnvironment || '0.0.0';

    newAnalytics.identify(current.id, {
      email: current.email,
      firstName: current.firstName,
      lastName: current.lastName,
      activepiecesVersion: currentVersion,
      activepiecesEnvironment: environment,
      ui: 'react',
    });

    newAnalytics.ready(() => {
      posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
        autocapture: false,
        capture_pageview: false,
        segment: (window as any).analytics,
        loaded: () => newAnalytics.page(),
      });

      posthog.identify(current.id, {
        email: current.email,
        firstName: current.firstName,
        lastName: current.lastName,
        activepiecesVersion: currentVersion,
        activepiecesEnvironment: environment,
      });
    });
    setAnalytics(newAnalytics);
    initializedUserEmail = current.email;
  };

  const reset = () => {
    if (analytics()) {
      analytics()?.reset();
    }
    posthog.reset();
    console.log('Telemetry removed');
    initializedUserEmail = null;
  };

  const capture = (event: TelemetryEvent) => {
    if (telemetryEnabled && analytics()) {
      analytics()?.track(event.name, event.payload);
    }
  };

  return (
    <TelemetryContext.Provider value={{ capture, reset }}>
      {children}
    </TelemetryContext.Provider>
  );
};

interface TelemetryContextType {
  capture: (event: TelemetryEvent) => void;
  reset: () => void;
}

const TelemetryContext = createContext<TelemetryContextType>({
  capture: () => {},
  reset: () => {},
});

export const useTelemetry = () => useContext(TelemetryContext);

export default TelemetryProvider;
