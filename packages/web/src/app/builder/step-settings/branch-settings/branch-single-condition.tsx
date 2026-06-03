import {
  BranchOperator,
  textConditions,
  singleValueConditions,
  RouterAction,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Trash } from 'lucide-solid';
import { Show, createMemo } from 'solid-js';

import { BuilderField, useFormContext } from '@/app/builder/builder-form';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { InvalidStepIcon } from '../../../../components/custom/alert-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { TextInputWithMentions } from '../../piece-properties/text-input-with-mentions';

const textToBranchOperation: Record<BranchOperator, string> = {
  [BranchOperator.TEXT_CONTAINS]: t('(Text) Contains'),
  [BranchOperator.TEXT_DOES_NOT_CONTAIN]: t('(Text) Does not contain'),
  [BranchOperator.TEXT_EXACTLY_MATCHES]: t('(Text) Exactly matches'),
  [BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH]: t(
    '(Text) Does not exactly match',
  ),
  [BranchOperator.TEXT_STARTS_WITH]: t('(Text) Starts with'),
  [BranchOperator.TEXT_DOES_NOT_START_WITH]: t('(Text) Does not start with'),
  [BranchOperator.TEXT_ENDS_WITH]: t('(Text) Ends with'),
  [BranchOperator.TEXT_DOES_NOT_END_WITH]: t('(Text) Does not end with'),
  [BranchOperator.LIST_CONTAINS]: t('(List) Contains'),
  [BranchOperator.LIST_DOES_NOT_CONTAIN]: t('(List) Does not contain'),
  [BranchOperator.NUMBER_IS_GREATER_THAN]: t('(Number) Is greater than'),
  [BranchOperator.NUMBER_IS_LESS_THAN]: t('(Number) Is less than'),
  [BranchOperator.NUMBER_IS_EQUAL_TO]: t('(Number) Is equal to'),
  [BranchOperator.DATE_IS_AFTER]: t('(Date/time) After'),
  [BranchOperator.DATE_IS_BEFORE]: t('(Date/time) Before'),
  [BranchOperator.DATE_IS_EQUAL]: t('(Date/time) Equals'),
  [BranchOperator.BOOLEAN_IS_TRUE]: t('(Boolean) Is true'),
  [BranchOperator.BOOLEAN_IS_FALSE]: t('(Boolean) Is false'),
  [BranchOperator.LIST_IS_EMPTY]: t('(List) Is empty'),
  [BranchOperator.LIST_IS_NOT_EMPTY]: t('(List) Is not empty'),
  [BranchOperator.EXISTS]: t('Exists'),
  [BranchOperator.DOES_NOT_EXIST]: t('Does not exist'),
};
const operationOptions = Object.entries(textToBranchOperation).map(
  ([operator, label]) => {
    return {
      label,
      value: operator,
    };
  },
);

type BranchSingleConditionProps = {
  showDelete: boolean;
  groupIndex: number;
  conditionIndex: number;
  readonly: boolean;
  deleteClick: () => void;
  branchIndex: number;
};

const BranchSingleCondition = (props: BranchSingleConditionProps) => {
  const form = useFormContext<RouterAction>();

  const condition = createMemo(() =>
    form.getValues(
      `settings.branches.${props.branchIndex}.conditions.${props.groupIndex}.${props.conditionIndex}`,
    ),
  );

  const isTextCondition = createMemo(() =>
    textConditions.includes(getOperator(condition())),
  );
  const isSingleValueCondition = createMemo(() =>
    singleValueConditions.includes(getOperator(condition())),
  );
  const isInvalid = createMemo(() =>
    isConditionInvalid(condition(), isSingleValueCondition()),
  );
  return (
    <>
      <div class="flex items-center gap-2">
        <Show when={isInvalid()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <InvalidStepIcon class="h-4 w-4 shrink-0" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Incomplete condition')}
            </TooltipContent>
          </Tooltip>
        </Show>
        <div
          class={cn('grid gap-2 grow', {
            'grid-cols-2': isSingleValueCondition(),
            'grid-cols-3': !isSingleValueCondition(),
          })}
        >
          <FormField
            name={`settings.branches.${props.branchIndex}.conditions.${props.groupIndex}.${props.conditionIndex}.firstValue`}
            control={form.control}
            render={({ field }: { field: BuilderField<string> }) => {
              return (
                <FormItem>
                  <TextInputWithMentions
                    disabled={props.readonly}
                    placeholder={t('First value')}
                    onChange={(value) => {
                      field.onChange(value);
                      void form.trigger();
                    }}
                    initialValue={field.value}
                  />
                </FormItem>
              );
            }}
          />
          <FormField
            name={`settings.branches.${props.branchIndex}.conditions.${props.groupIndex}.${props.conditionIndex}.operator`}
            control={form.control}
            render={({ field }: { field: BuilderField<BranchOperator> }) => (
              <FormItem>
                <SearchableSelect
                  disabled={props.readonly}
                  value={field.value}
                  options={operationOptions}
                  placeholder={''}
                  onChange={(e) => {
                    if (
                      isSingleValueCondition() &&
                      e !== null &&
                      isBranchOperator(e) &&
                      !singleValueConditions.includes(e)
                    ) {
                      form.setValue(
                        `settings.branches.${props.branchIndex}.conditions.${props.groupIndex}.${props.conditionIndex}.secondValue`,
                        '',
                      );
                    }
                    field.onChange(e);
                    void form.trigger();
                  }}
                />
              </FormItem>
            )}
          />
          <Show when={!isSingleValueCondition()}>
            <FormField
              name={`settings.branches.${props.branchIndex}.conditions.${props.groupIndex}.${props.conditionIndex}.secondValue`}
              control={form.control}
              render={({ field }: { field: BuilderField<string> }) => (
                <FormItem>
                  <TextInputWithMentions
                    placeholder={t('Second value')}
                    disabled={props.readonly}
                    initialValue={field.value || ''}
                    onChange={(value) => {
                      field.onChange(value);
                      void form.trigger();
                    }}
                  />
                </FormItem>
              )}
            />
          </Show>
        </div>
      </div>

      <div class="flex justify-start items-center gap-2 mt-2">
        <Show when={isTextCondition()}>
          <FormField
            name={`settings.branches.${props.branchIndex}.conditions.${props.groupIndex}.${props.conditionIndex}.caseSensitive`}
            control={form.control}
            render={({ field }: { field: BuilderField<boolean> }) => (
              <FormItem>
                <div class="flex items-center gap-2 p-1">
                  <Switch
                    disabled={props.readonly}
                    id="case-sensitive"
                    checked={field.value}
                    onCheckedChange={(e) => field.onChange(e)}
                  />
                  <Label for="case-sensitive">{t('Case sensitive')}</Label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </Show>
        <div class="grow" />
        <div>
          <Show when={props.showDelete}>
            <Button
              variant={'basic'}
              class="text-destructive gap-2 items-center"
              size={'sm'}
              onClick={props.deleteClick}
            >
              <Trash class="w-4 h-4" /> {t('Remove')}
            </Button>
          </Show>
        </div>
      </div>
    </>
  );
};

export { BranchSingleCondition };

function isBranchOperator(value: unknown): value is BranchOperator {
  return Object.values(BranchOperator).includes(value as BranchOperator);
}

function isConditionInvalid(condition: unknown, single: boolean) {
  if (!isRecord(condition)) {
    return true;
  }
  const firstValue =
    typeof condition.firstValue === 'string' ? condition.firstValue : '';
  if (single) {
    return firstValue.length === 0;
  }
  const secondValue =
    typeof condition.secondValue === 'string' ? condition.secondValue : '';
  return firstValue.length === 0 || secondValue.length === 0;
}

function getOperator(condition: unknown) {
  if (!isRecord(condition) || !isBranchOperator(condition.operator)) {
    return BranchOperator.EXISTS;
  }
  return condition.operator;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
