import { QueryClientProvider } from '@tanstack/solid-query';

import { ApErrorDialog } from '@/components/custom/ap-error-dialog/ap-error-dialog';
import { EmbeddingProvider } from '@/components/providers/embed-provider';
import TelemetryProvider from '@/components/providers/telemetry-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RefreshAnalyticsProvider } from '@/features/platform-admin';

import { EmbeddingFontLoader } from './components/embedding-font-loader';
import { InitialDataGuard } from './components/initial-data-guard';
import { ApRouter } from './guards';
import { queryClient } from './query-client';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RefreshAnalyticsProvider>
        <EmbeddingProvider>
          <InitialDataGuard>
            <EmbeddingFontLoader>
              <TelemetryProvider>
                <TooltipProvider>
                  <ThemeProvider storageKey="vite-ui-theme">
                    <ApRouter />
                    <Toaster position="bottom-right" />
                    <ApErrorDialog />
                  </ThemeProvider>
                </TooltipProvider>
              </TelemetryProvider>
            </EmbeddingFontLoader>
          </InitialDataGuard>
        </EmbeddingProvider>
      </RefreshAnalyticsProvider>
    </QueryClientProvider>
  );
}

export default App;
