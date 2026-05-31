import { t } from 'i18next';
import { Plus, TrashIcon } from 'lucide-solid';

import { TextWithIcon } from '@/components/custom/text-with-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DictionaryInputItem = {
  key: string;
  value: string;
  id: string;
};

export const DictionaryInput = ({
  values,
  onChange,
  disabled,
  renderValueInput,
  keyInputClassName,
  keyPlaceholder,
  valuePlaceholder,
}: DictionaryInputProps) => {
  let id = 1;
  const valuesArray = Object.entries(values ?? {}).map((el) => {
    id++;
    return {
      key: el[0],
      value: el[1],
      id: `${id}`,
    };
  });
  let valuesArrayRef = valuesArray;
  // To allow keys that have the same prefix to be added in any order
  const valuesArrayRefUnique = valuesArrayRef
    .toReversed()
    .filter(
      (el, index, self) => self.findIndex((t) => t.key === el.key) === index,
    )
    .toReversed();
  const haveValuesChangedFromOutside =
    valuesArrayRefUnique.length !== valuesArray.length ||
    valuesArray.reduce((acc, _, index) => {
      return (
        acc ||
        valuesArrayRefUnique[index].key !== valuesArray[index].key ||
        valuesArrayRefUnique[index].value !== valuesArray[index].value
      );
    }, false);

  if (haveValuesChangedFromOutside) {
    valuesArrayRef = valuesArray;
  }

  const remove = (index: number) => {
    const newValues = valuesArrayRef.filter((_, i) => i !== index);
    valuesArrayRef = newValues;
    updateValue(newValues);
  };
  const add = () => {
    id++;
    const newValues = [...valuesArrayRef, { key: '', value: '', id: `${id}` }];
    valuesArrayRef = newValues;
    updateValue(newValues);
  };

  const onChangeValue = (
    index: number,
    value: string | undefined,
    key: string | undefined,
  ) => {
    const newValues = [...valuesArrayRef];
    if (value !== undefined) {
      newValues[index].value = value;
    }
    if (key !== undefined) {
      newValues[index].key = key;
    }
    valuesArrayRef = newValues;
    updateValue(newValues);
  };

  const updateValue = (items: DictionaryInputItem[]) => {
    const value = items.reduce((acc, current) => {
      return { ...acc, [current.key]: current.value };
    }, {});
    onChange({ target: { value } } as unknown as Record<string, string>);
  };

  return (
    <div className={cn('flex w-full flex-col gap-2')}>
      <For each={valuesArrayRef}>
        {({ key, value, id }, index) => (
          <div
            key={'dictionary-input-' + id}
            className="flex items-center gap-3 items-center"
          >
            <Input
              value={key}
              disabled={disabled}
              placeholder={keyPlaceholder}
              class={cn('basis-[50%] max-w-[50%]', keyInputClassName)}
              onChange={(e) =>
                onChangeValue(index(), undefined, e.target.value)
              }
            />
            <div className="basis-[50%] max-w-[50%]">
              {renderValueInput ? (
                renderValueInput({
                  value,
                  onChange: (v) => onChangeValue(index(), v, undefined),
                  disabled,
                })
              ) : (
                <Input
                  value={value}
                  disabled={disabled}
                  placeholder={valuePlaceholder}
                  onChange={(e) =>
                    onChangeValue(index(), e.target.value, undefined)
                  }
                />
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              class="size-8 shrink-0"
              disabled={disabled}
              onClick={() => remove(index())}
            >
              <TrashIcon class="size-4 text-destructive" aria-hidden="true" />
              <span className="sr-only">{t('Remove')}</span>
            </Button>
          </div>
        )}
      </For>
      <Button
        variant="outline"
        size="sm"
        onClick={add}
        type="button"
        disabled={disabled}
      >
        <TextWithIcon icon={<Plus size={18} />} text={t('Add Item')} />
      </Button>
    </div>
  );
};

export type DictionaryInputProps = {
  values: Record<string, string> | undefined;
  onChange: (values: Record<string, string>) => void;
  disabled?: boolean;
  keyInputClassName?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  renderValueInput?: (params: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
  }) => any;
};
