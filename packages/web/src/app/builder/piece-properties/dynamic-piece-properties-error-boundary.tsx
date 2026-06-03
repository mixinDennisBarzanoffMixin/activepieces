import { t } from 'i18next';
import { RefreshCcw } from 'lucide-solid';
import { createSignal, ErrorBoundary } from 'solid-js';
import type { JSX } from 'solid-js';

import { Button } from '@/components/ui/button';

const DynamicPropertiesErrorBoundary = (props: { children: JSX.Element }) => {
  const [key, setKey] = createSignal(Date.now());
  let triedRerenderingRef = false;
  return (
    <ErrorBoundary
      key={key}
      fallback={
        !triedRerenderingRef ? (
          <div class="text-sm text-destructive italic flex justify-between items-center">
            {t('Unexpected error, please retry')}
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                setKey(Date.now());
                triedRerenderingRef = true;
              }}
            >
              {<RefreshCcw class="w-4 h-4 text-foreground!" />}{' '}
            </Button>
          </div>
        ) : (
          <div class="text-sm text-destructive italic flex justify-between items-center">
            {t('Unexpected error, please refresh the page or contact support')}
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                window.location.reload();
              }}
            >
              {<RefreshCcw class="w-4 h-4 text-foreground!" />}{' '}
            </Button>
          </div>
        )
      }
    >
      {props.children}
    </ErrorBoundary>
  );
};

export { DynamicPropertiesErrorBoundary };
