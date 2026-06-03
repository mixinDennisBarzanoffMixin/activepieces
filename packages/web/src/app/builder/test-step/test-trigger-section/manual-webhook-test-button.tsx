import { FlowTrigger } from '@activepieces/shared';
import { t } from 'i18next';
import { createSignal } from 'solid-js';

import { useFormContext } from '@/app/builder/builder-form';
import { Button } from '@/components/ui/button';

import TestWebhookDialog from '../custom-test-step/test-webhook-dialog';

type ManualWebhookTestButtonProps = {
  isWebhookTestingDialogOpen: boolean;
  setIsWebhookTestingDialogOpen: (open: boolean) => void;
};

export const ManualWebhookTestButton = (
  props: ManualWebhookTestButtonProps,
) => {
  const [id, setId] = createSignal<number>(0);
  const formValues = useFormContext<FlowTrigger>().getValues();

  return (
    <>
      <Button
        variant="default"
        size="sm"
        class="flex items-center gap-2"
        onClick={() => {
          props.setIsWebhookTestingDialogOpen(true);
        }}
      >
        {t('Generate Sample Data')}
      </Button>

      <TestWebhookDialog
        key={`test-webhook-dialog-${id()}`}
        open={props.isWebhookTestingDialogOpen}
        onOpenChange={(val) => {
          if (!val) {
            setTimeout(() => {
              setId(id() + 1);
            }, 200);
          }
          props.setIsWebhookTestingDialogOpen(val);
        }}
        testingMode="trigger"
        currentStep={formValues}
      />
    </>
  );
};
