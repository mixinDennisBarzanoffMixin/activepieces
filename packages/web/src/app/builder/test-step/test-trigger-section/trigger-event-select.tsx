import { FlowTrigger, TriggerEventWithPayload } from '@activepieces/shared';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { For, Show, createMemo } from 'solid-js';

import { useFormContext } from '@/app/builder/builder-form';
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

export const TriggerEventSelect = (props: TriggerEventSelectProps) => {
  const selectedId = createMemo(() =>
    getSelectedId(props.sampleData, props.pollResults?.data ?? []),
  );

  const form = useFormContext<Pick<FlowTrigger, 'name' | 'settings'>>();
  const formValues = form.getValues();

  const updateSampleData = useBuilderStateContext((state) => ({
    value: state.updateSampleData,
  })).value;

  return (
    <div class="mb-3 px-3 pt-3">
      <Select
        value={selectedId()}
        onValueChange={(value: string) => {
          const triggerEvent = props.pollResults?.data.find(
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
          disabled={props.pollResults && props.pollResults.data.length === 0}
        >
          <Show
            when={props.pollResults && props.pollResults.data.length > 0}
            fallback={t('Old results were removed, retest for new sample data')}
          >
            <SelectValue placeholder={String(t('No sample data available'))} />
          </Show>
        </SelectTrigger>
        <SelectContent>
          <Show when={props.pollResults}>
            <For each={props.pollResults.data}>
              {(triggerEvent, index) => (
                <SelectItem key={triggerEvent.id} value={triggerEvent.id}>
                  {t('Result #') + (index() + 1)}
                </SelectItem>
              )}
            </For>
          </Show>
        </SelectContent>
      </Select>
      <span class="text-sm mt-2 text-muted-foreground">
        {t('The sample data can be used in the next steps.')}
      </span>
    </div>
  );
};

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
