import { RouterAction } from '@activepieces/shared';
import { t } from 'i18next';
import { For, Show } from 'solid-js';

import { createBuilderFieldArray, useFormContext } from '@/app/builder/builder-form';
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

const BranchConditionGroup = ({
  readonly,
  groupIndex,
  onAnd,
  onOr,
  handleDelete,
  numberOfGroups,
  branchIndex,
}: BranchConditionGroupProps) => {
  const form = useFormContext<RouterAction>();
  const { fields } = createBuilderFieldArray({
    form,
    name: `settings.branches.${branchIndex}.conditions.${groupIndex}` as const,
  });
  return (
    <div className="flex flex-col gap-4">
      <Show when={groupIndex > 0()}>
        <HorizontalSeparatorWithText class="my-2">
          {t('OR')}
        </HorizontalSeparatorWithText>
      </Show>
      <Show when={fields().length === 0()}>
        <BranchConditionToolbar
          readonly={readonly}
          key={`toolbar-${groupIndex}`}
          onAnd={onAnd}
          onOr={onOr}
          showOr={true}
          showAnd={true}
        />
      </Show>
      <For each={fields()}>
        {(condition, conditionIndex) => (
          <>
            <Show when={conditionIndex > 0()}>
              <div>{t('And If')}</div>
            </Show>
            <BranchSingleCondition
              groupIndex={groupIndex}
              readonly={readonly}
              conditionIndex={conditionIndex}
              deleteClick={() => handleDelete(conditionIndex)}
              showDelete={numberOfGroups !== 1 || fields().length !== 1}
              branchIndex={branchIndex}
            />
          </>
        )}
      </For>
      <BranchConditionToolbar
        onAnd={onAnd}
        onOr={onOr}
        readonly={readonly}
        showOr={true}
        showAnd={true}
      />
    </div>
  );
};

BranchConditionGroup.displayName = 'ConditionGroup';

export { BranchConditionGroup };
