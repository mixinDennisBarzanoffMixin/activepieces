import { useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import { AlertCircle, RefreshCw, Home } from 'lucide-solid';
import { createSignal, createEffect } from 'solid-js';

import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';

export const Error = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = createSignal(5);

  createEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/platform/setup/billing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  });

  return (
    <div class="h-full bg-background flex items-center justify-center p-4">
      <div class="w-full max-w-md border-destructive/20">
        <CardContent class="pt-8 pb-6 px-6">
          <div class="text-center space-y-6">
            <div class="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle class="w-10 h-10 text-destructive" />
            </div>

            <div class="space-y-3">
              <h1 class="text-2xl font-semibold text-foreground">
                {t('Something went wrong')}
              </h1>
              <p class="text-lg text-muted-foreground">
                {t('Subscription update failed')}
              </p>
            </div>

            <div class="bg-muted/30 rounded-lg p-4 text-left">
              <h3 class="text-sm font-medium text-foreground mb-2">
                {t('What you can do:')}
              </h3>
              <ul class="text-sm text-muted-foreground space-y-1">
                <li>{t('Verify your payment method')}</li>
                <li>{t('Try again in a few moments')}</li>
                <li>{t('Contact support if issues persist')}</li>
              </ul>
            </div>

            <div class="flex flex-col gap-3 pt-2">
              <Button
                onClick={() => navigate('/platform/setup/billing')}
                class="w-full"
              >
                <RefreshCw class="w-4 h-4 mr-2" />
                {t('Try Again')}
              </Button>

              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                class="w-full"
              >
                <Home class="w-4 h-4 mr-2" />
                {t('Go to Dashboard')}
              </Button>
            </div>

            <p class="text-xs text-muted-foreground">
              {t('Redirecting to billing in {countdown} seconds...', {
                countdown,
              })}
            </p>
          </div>
        </CardContent>
      </div>
    </div>
  );
};
