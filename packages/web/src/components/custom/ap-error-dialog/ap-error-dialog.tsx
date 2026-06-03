import { t } from 'i18next';
import { AlertCircleIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';

import { useApErrorDialogStore } from './ap-error-dialog-store';

const ApErrorDialog = () => {
  const { params, closeDialog } = useApErrorDialogStore();

  return (
    <Dialog open={!!params()} onOpenChange={closeDialog}>
      <DialogContent>
        <Show when={params()}>
          {(param) => (
            <>
              <DialogHeader>
                <div class="flex flex-col items-center">
                  <span
                    class="rounded-full bg-destructive-100 flex items-center justify-center mb-2 mt-1"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <AlertCircleIcon class="h-8 w-8 text-destructive" />
                  </span>
                  <div class="flex flex-col items-center text-center w-full gap-2">
                    <DialogTitle class="text-lg font-semibold">
                      {param().title}
                    </DialogTitle>
                    <Show when={param().description}>
                      <DialogDescription class="mt-0.5 text-sm text-muted-foreground">
                        {param().description}
                      </DialogDescription>
                    </Show>
                  </div>
                </div>
              </DialogHeader>
              <div class="w-full flex flex-col items-stretch mt-2 max-h-[60vh] overflow-y-auto">
                <CollapsibleJson
                  json={param().error}
                  label={t('Technical Details')}
                  defaultOpen={true}
                  class="w-full text-left"
                />
              </div>
            </>
          )}
        </Show>
        <DialogFooter class="mt-2">
          <Button variant="outline" onClick={closeDialog}>
            {t('Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ApErrorDialog };
