import { t } from 'i18next';
import { AlertCircle } from 'lucide-solid';
import { Show } from 'solid-js';
import type { Accessor } from 'solid-js';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type SimulationSectionProps = {
  note: Accessor<string | null | undefined>;
  resetSimulation: () => void;
  abortControllerRef: { current: AbortController };
};

export const SimulationNote = (props: SimulationSectionProps) => {
  return (
    <div class="flex flex-col gap-4 w-full px-3 pt-3">
      <div class="flex gap-2 items-center justify-center w-full">
        <LoadingSpinner class="size-4" />
        <div>{t('Testing Trigger')}</div>
        <div class="grow" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            props.resetSimulation();
            props.abortControllerRef.current.abort();
            props.abortControllerRef.current = new AbortController();
          }}
        >
          {t('Cancel')}
        </Button>
      </div>

      <Show when={props.note()}>
        <Alert>
          <AlertCircle class="h-4 w-4 text-warning" />
          <div class="flex flex-col gap-1">
            <AlertTitle>{t('Action Required')}:</AlertTitle>
            <AlertDescription>
              <div class="break-wrods">{props.note()}</div>
            </AlertDescription>
          </div>
        </Alert>
      </Show>
    </div>
  );
};
