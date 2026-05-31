import { t } from 'i18next';
import { RefreshCcw } from 'lucide-solid';
import { createSignal, ErrorBoundary } from 'solid-js';

import { Button } from '@/components/ui/button';

const DynamicPropertiesErrorBoundary = ({ children }: { children: any }) => {
  const [key, setKey] = createSignal(Date.now());
  let triedRerenderingRef: any | undefined;
  return (
    <ErrorBoundary
      key={key}
      fallback={
        !triedRerenderingRef ? (
          <div className="text-sm text-destructive italic flex justify-between items-center">
            {t('Unexpected error, please retry')}
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                setKey(Date.now());
                triedRerenderingRef = true;
              }}
            >
              {<RefreshCcw class="w-4 h-4 text-foreground!"></RefreshCcw>}{' '}
            </Button>
          </div>
        ) : (
          <div className="text-sm text-destructive italic flex justify-between items-center">
            {t('Unexpected error, please refresh the page or contact support')}
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                window.location.reload();
              }}
            >
              {<RefreshCcw class="w-4 h-4 text-foreground!"></RefreshCcw>}{' '}
            </Button>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
};
DynamicPropertiesErrorBoundary.displayName = 'DynamicPropertiesErrorBoundary';
export { DynamicPropertiesErrorBoundary };
