import { FlowTrigger, TriggerEventWithPayload } from '@activepieces/shared';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { useFormContext } from '@/app/builder/builder-form';
import { For, Show } from 'solid-js';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useBuilderStateContext } from '../../builder-hooks';

type TriggerEventSelectProps = {
  pollResults: { data: TriggerEventWithPayload[] } | undefined;
  sampleData: unknown;
};

export const TriggerEventSelect = ({
  pollResults,
  sampleData,
}: TriggerEventSelectProps) => {
  const selectedId = getSelectedId(sampleData, pollResults?.data ?? []);

  const form = useFormContext<Pick<FlowTrigger, 'name' | 'settings'>>();
  const formValues = form.getValues();

  const updateSampleData = useBuilderStateContext(
    (state) => state.updateSampleData,
  );

  return (
    <div className="mb-3 px-3 pt-3">
      <Select
        value={selectedId}
        onValueChange={(value: string) => {
          const triggerEvent = pollResults?.data.find(
            (triggerEvent) => triggerEvent.id === value,
          );
          if (triggerEvent) {
            updateSampleData({
              stepName: formValues.name,
              output: triggerEvent.payload,
            });
          }
        }}
      >
        <SelectTrigger
          class="w-full"
          disabled={pollResults && pollResults.data.length === 0}
        >
          <Show
            when={pollResults && pollResults.data.length > 0()}
            fallback={t('Old results were removed, retest for new sample data')}
          >
            <SelectValue
              placeholder={t('No sample data available')}
            ></SelectValue>
          </Show>
        </SelectTrigger>
        <SelectContent>
          <Show when={pollResults()}>
            <For each={pollResults.data}>
              {(triggerEvent, index) => (
                <SelectItem key={triggerEvent.id} value={triggerEvent.id}>
                  {t('Result #') + (index + 1)}
                </SelectItem>
              )}
            </For>
          </Show>
        </SelectContent>
      </Select>
      <span className="text-sm mt-2 text-muted-foreground">
        {t('The sample data can be used in the next steps.')}
      </span>
    </div>
  );
};

TriggerEventSelect.displayName = 'TriggerEventSelect';

function getSelectedId(
  sampleData: unknown,
  pollResults: TriggerEventWithPayload[],
) {
  if (sampleData === undefined) {
    return undefined;
  }
  return pollResults.find((result) => deepEqual(sampleData, result.payload))
    ?.id;
}
