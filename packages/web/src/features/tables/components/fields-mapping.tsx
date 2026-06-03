import { Field } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeftIcon } from 'lucide-solid';
import { createEffect, createMemo, createSignal, For } from 'solid-js';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Input } from '@/components/ui/input';

import { FieldsMapping } from '../utils/utils';

const FieldsMappingControl = (props: {
  onInput: (fieldsMapping: FieldsMapping) => void;
  fields: Field[];
  csvColumns: string[];
}) => {
  const [fieldsMapping, setFieldsMapping] = createSignal<FieldsMapping>([]);
  createEffect(() => {
    if (fieldsMapping().length !== props.csvColumns.length) {
      setFieldsMapping(
        Array(props.csvColumns.length)
          .fill(null)
          .map((_, index) =>
            index > props.fields.length - 1 ? null : props.fields[index].id,
          ),
      );
    }
    props.onInput(fieldsMapping());
  });
  const csvColumnsOptions = createMemo(() => [
    ...props.csvColumns.map((column, index) => ({
      label: column,
      value: index.toString(),
    })),
    { label: t('Ignored'), value: 'ignore' },
  ]);
  const findFieldIdCsvIndex = (fieldId: string) => {
    const res = fieldsMapping().findIndex((id) => id === fieldId);
    if (res !== -1) {
      return res.toString();
    }
    return 'ignore';
  };
  const handleChange = (fieldId: string, columnIndex: string | null) => {
    const newFieldsMapping = [...fieldsMapping()];
    const columnIndexUsingFieldId = findFieldIdCsvIndex(fieldId);
    if (columnIndexUsingFieldId !== 'ignore' || columnIndex === 'ignore') {
      newFieldsMapping[parseInt(columnIndexUsingFieldId)] = null;
    }
    if (columnIndex !== null && columnIndex !== 'ignore') {
      newFieldsMapping[parseInt(columnIndex)] = fieldId;
    }
    setFieldsMapping(newFieldsMapping);
    props.onInput(newFieldsMapping);
  };
  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <div class="flex-1 text-center text-sm">{t('Table')}</div>
        <ArrowLeftIcon class=" w-4 h-4 opacity-0 shrink-0" />
        <div class="flex-1 text-center text-sm">{t('CSV')}</div>
      </div>
      <For each={props.fields}>
        {(field) => (
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <Input value={field.name} readOnly />
            </div>
            <ArrowLeftIcon class="w-4 h-4 shrink-0" />
            <div class="flex-1">
              <SearchableSelect
                options={csvColumnsOptions()}
                onInput={(value) => handleChange(field.id, value)}
                value={findFieldIdCsvIndex(field.id)}
                placeholder={t('Field')}
                showDeselect={false}
              />
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

export { FieldsMappingControl };
