import { t } from 'i18next';
import { Plus, TrashIcon } from 'lucide-solid';
import {
  createEffect,
  createSignal,
  For,
  type JSXElement,
  Show,
} from 'solid-js';

import { TextWithIcon } from '@/components/custom/text-with-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DictionaryInputItem = {
  key: string;
  value: string;
  id: string;
};

export const DictionaryInput = (props: DictionaryInputProps) => {
  let id = 1;
  const next = () => `${++id}`;
  const values = () => {
    if (props.values === undefined) {
      return [];
    }
    return Object.entries(props.values).map(([key, value]) => ({
      key,
      value,
      id: next(),
    }));
  };
  const [items, setItems] = createSignal<DictionaryInputItem[]>(values());

  createEffect(() => setItems(values()));

  const remove = (index: number) => {
    const next = items().filter((_, i) => i !== index);
    setItems(next);
    updateValue(next);
  };
  const add = () => {
    const list = [...items(), { key: '', value: '', id: next() }];
    setItems(list);
    updateValue(list);
  };

  const onChangeValue = (
    index: number,
    value: string | undefined,
    key: string | undefined,
  ) => {
    const next = items().map((item, i) => {
      if (i !== index) {
        return item;
      }
      return {
        ...item,
        key: key === undefined ? item.key : key,
        value: value === undefined ? item.value : value,
      };
    });
    setItems(next);
    updateValue(next);
  };

  const updateValue = (items: DictionaryInputItem[]) => {
    const value = items.reduce((acc, current) => {
      return { ...acc, [current.key]: current.value };
    }, {});
    props.onChange(value);
  };

  return (
    <div class={cn('flex w-full flex-col gap-2')}>
      <For each={items()}>
        {({ key, value }, index) => (
          <div class="flex items-center gap-3 items-center">
            <Input
              value={key}
              disabled={props.disabled}
              placeholder={props.keyPlaceholder}
              class={cn('basis-[50%] max-w-[50%]', props.keyInputClassName)}
              onChange={(e) =>
                onChangeValue(index(), undefined, e.currentTarget.value)
              }
            />
            <div class="basis-[50%] max-w-[50%]">
              <Show
                when={props.renderValueInput}
                fallback={
                  <Input
                    value={value}
                    disabled={props.disabled}
                    placeholder={props.valuePlaceholder}
                    onChange={(e) =>
                      onChangeValue(index(), e.currentTarget.value, undefined)
                    }
                  />
                }
              >
                {props.renderValueInput({
                  value,
                  onChange: (v) => onChangeValue(index(), v, undefined),
                  disabled: props.disabled,
                })}
              </Show>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              class="size-8 shrink-0"
              disabled={props.disabled}
              onClick={() => remove(index())}
            >
              <TrashIcon class="size-4 text-destructive" aria-hidden="true" />
              <span class="sr-only">{t('Remove')}</span>
            </Button>
          </div>
        )}
      </For>
      <Button
        variant="outline"
        size="sm"
        onClick={add}
        type="button"
        disabled={props.disabled}
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
  }) => JSXElement;
};
