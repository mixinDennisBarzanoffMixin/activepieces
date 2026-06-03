import { RouterAction } from '@activepieces/shared';
import { t } from 'i18next';
import { For, Show } from 'solid-js';

import {
  createBuilderFieldArray,
  useFormContext,
} from '@/app/builder/builder-form';
import { BranchConditionToolbar } from '@/app/builder/step-settings/branch-settings/branch-condition-toolbar';
import { BranchSingleCondition } from '@/app/builder/step-settings/branch-settings/branch-single-condition';
import { HorizontalSeparatorWithText } from '@/components/ui/separator';

type BranchConditionGroupProps = {
  readonly: boolean;
  groupIndex: number;
  onAnd: () => void;
  onOr: () => void;
  numberOfGroups: number;
  handleDelete: (conditionIndex: number) => void;
  branchIndex: number;
};

const BranchConditionGroup = (props: BranchConditionGroupProps) => {
  const form = useFormContext<RouterAction>();
  const { fields } = createBuilderFieldArray({
    form,
    name: `settings.branches.${props.branchIndex}.conditions.${props.groupIndex}` as const,
  });
  return (
    <div class="flex flex-col gap-4">
      <Show when={props.groupIndex > 0}>
        <HorizontalSeparatorWithText class="my-2">
          {t('OR')}
        </HorizontalSeparatorWithText>
      </Show>
      <Show when={fields().length === 0}>
        <BranchConditionToolbar
          readonly={props.readonly}
          key={`toolbar-${props.groupIndex}`}
          onAnd={props.onAnd}
          onOr={props.onOr}
          showOr={true}
          showAnd={true}
        />
      </Show>
      <For each={fields()}>
        {(condition, conditionIndex) => (
          <>
            <Show when={conditionIndex() > 0}>
              <div>{t('And If')}</div>
            </Show>
            <BranchSingleCondition
              groupIndex={props.groupIndex}
              readonly={props.readonly}
              conditionIndex={conditionIndex}
              deleteClick={() => props.handleDelete(conditionIndex)}
              showDelete={props.numberOfGroups !== 1 || fields().length !== 1}
              branchIndex={props.branchIndex}
            />
          </>
        )}
      </For>
      <BranchConditionToolbar
        onAnd={props.onAnd}
        onOr={props.onOr}
        readonly={props.readonly}
        showOr={true}
        showAnd={true}
      />
    </div>
  );
};

export { BranchConditionGroup };
