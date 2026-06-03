import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Show } from 'solid-js';

import { flagsHooks } from '@/hooks/flags-hooks';

import { useTableState } from './ap-table-state-provider';

const ApTableFooter = (props: {
  fieldsCount: number;
  recordsCount: number;
}) => {
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );
  const { data: maxFields } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FIELDS_PER_TABLE,
  );
  const selectedRecords = useTableState((state) => state.selectedRecords);
  return (
    <div class="flex items-center justify-between bg-muted/30 px-2 h-[40px]">
      <div class="flex items-center gap-2">
        <div class="text-sm font-sm mt-1">
          <Show
            when={
              !(
                selectedRecords.size === props.recordsCount &&
                props.recordsCount > 0
              )
            }
          >
            <>
              {selectedRecords.size === 0 &&
                `${t('recordsCount', {
                  recordsCount: props.recordsCount,
                })} (${(maxRecords
                  ? (props.recordsCount / maxRecords) * 100
                  : 0
                ).toFixed(2)}%)`}{' '}
              {selectedRecords.size > 0 &&
                `${t('selected')} ${t('recordsCount', {
                  recordsCount: selectedRecords.size,
                })}`}
            </>
          </Show>
          {selectedRecords.size === props.recordsCount &&
            props.recordsCount > 0 &&
            t('All records selected')}
        </div>
        |
        <div class="text-sm font-sm mt-1">
          {t('fieldsCount', { fieldsCount: props.fieldsCount })} (
          {(maxFields ? (props.fieldsCount / maxFields) * 100 : 0).toFixed(2)}%)
        </div>
      </div>
    </div>
  );
};

export { ApTableFooter };
