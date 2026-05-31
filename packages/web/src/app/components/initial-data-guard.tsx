import { Suspense, JSX } from 'solid-js';

import { LoadingScreen } from '@/components/custom/loading-screen';
import { useEmbedding } from '@/components/providers/embed-provider';

type InitialDataGuardProps = {
  children: JSX.Element;
};
export const InitialDataGuard = ({ children }: InitialDataGuardProps) => {
  const { embedState } = useEmbedding();
  return (
    <Suspense
      fallback={
        <LoadingScreen
          brightSpinner={embedState.useDarkBackground}
        ></LoadingScreen>
      }
    >
      {children}
    </Suspense>
  );
};
