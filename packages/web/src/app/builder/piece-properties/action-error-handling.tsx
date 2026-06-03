import { FlowAction, FlowTrigger } from '@activepieces/shared';
import { t } from 'i18next';
import { Show } from 'solid-js';

import { BuilderField, useFormContext } from '@/app/builder/builder-form';
import { ReadMoreDescription } from '@/components/custom/read-more-description';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';

type ActionErrorHandlingFormProps = {
  hideContinueOnFailure?: boolean;
  hideRetryOnFailure?: boolean;
  disabled: boolean;
};

const ActionErrorHandlingForm = (props: ActionErrorHandlingFormProps) => {
  const form = useFormContext<FlowAction | FlowTrigger>();

  return (
    <div class={cn('grid', GAP_SIZE_FOR_STEP_SETTINGS)}>
      <Show when={props.hideContinueOnFailure !== true}>
        <FormField
          name="settings.errorHandlingOptions.continueOnFailure.value"
          control={form.control}
          render={({ field }: { field: BuilderField<boolean> }) => (
            <FormItem>
              <FormLabel
                for="continueOnFailure"
                class="flex items-center gap-1 h-7.5 max-h-7.5"
              >
                <FormControl>
                  <Switch
                    disabled={props.disabled}
                    id="continueOnFailure"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <span class="ml-2">{t('Continue on Failure')}</span>
              </FormLabel>
              <ReadMoreDescription
                text={t(
                  'Enable this option to skip this step and continue the flow normally if it fails.',
                )}
              />
            </FormItem>
          )}
        />
      </Show>
      <Show when={props.hideRetryOnFailure !== true}>
        <FormField
          name="settings.errorHandlingOptions.retryOnFailure.value"
          control={form.control}
          render={({ field }: { field: BuilderField<boolean> }) => (
            <FormItem>
              <FormLabel
                for="retryOnFailure"
                class="flex items-center gap-1 h-7.5 max-h-7.5"
              >
                <FormControl>
                  <Switch
                    disabled={props.disabled}
                    id="retryOnFailure"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <span class="ml-2">{t('Retry on Failure')}</span>
              </FormLabel>
              <ReadMoreDescription
                text={t('Automatically retry up to four attempts when failed.')}
              />
            </FormItem>
          )}
        />
      </Show>
    </div>
  );
};

export { ActionErrorHandlingForm };
