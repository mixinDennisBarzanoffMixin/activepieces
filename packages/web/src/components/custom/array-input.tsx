import { t } from 'i18next';
import { GripVertical, Plus, TrashIcon } from 'lucide-solid';
import { nanoid } from 'nanoid';
import { createMemo, createSignal, For, Show } from 'solid-js';

import { TextWithIcon } from '@/components/custom/text-with-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/sortable';
import { cn } from '@/lib/utils';

type ArrayInputProps = {
  inputName: string;
  disabled: boolean | (() => boolean);
  required?: boolean;
  value?: string[];
  onChange?: (value: string[]) => void;
  customInputNode?: (
    onChange: (value: string) => void,
    value: string,
    disabled: boolean,
  ) => any;
  thinInputs?: boolean;
};

type ArrayField = {
  id: string;
  value: string;
};

const ArrayInput = ({
  inputName,
  disabled,
  required,
  customInputNode,
  thinInputs,
}: ArrayInputProps) => {
  const initial = value ?? [];
  const [fields, setFields] = createSignal<ArrayField[]>(
    initial.map((item) => ({
      id: nanoid(),
      value: item,
    })),
  );
  const blocked = createMemo(() =>
    typeof disabled === 'function' ? disabled() : disabled,
  );

  const updateFormValue = (newFields: ArrayField[]) => {
    onChange?.(newFields.map((f) => f.value));
  };

  const append = () => {
    const newFields = [...fields(), { id: nanoid(), value: '' }];

    setFields(newFields);
    updateFormValue(newFields);
  };

  const remove = (index: number) => {
    const newFields = fields().filter((_, i) => i !== index);
    setFields(newFields);
    updateFormValue(newFields);
  };

  const move = (from: number, to: number) => {
    const newFields = [...fields()];
    const [removed] = newFields.splice(from, 1);
    newFields.splice(to, 0, removed);
    setFields(newFields);
    updateFormValue(newFields);
  };

  const updateFieldValue = (index: number, newValue: string) => {
    const newFields = fields().map((field, i) =>
      i === index ? { ...field, value: newValue } : field,
    );
    setFields(newFields);
    updateFormValue(newFields);
  };
  const showRemoveButton = createMemo(() => !required || fields().length > 1);

  return (
    <>
      <div className="flex w-full flex-col gap-2.5 ">
        <Sortable
          value={fields()}
          onMove={({ activeIndex, overIndex }) => {
            move(activeIndex, overIndex);
          }}
        >
          <For each={fields()}>
            {(field, index) => (
              <SortableItem value={field.id} asChild>
                <div className="flex items-center gap-3">
                  <SortableDragHandle
                    variant="outline"
                    size="icon"
                    disabled={blocked()}
                    class={cn('shrink-0 size-8', thinInputs && 'size-7')}
                  >
                    <GripVertical class="size-4" aria-hidden="true" />
                  </SortableDragHandle>

                  <div class="grow">
                    {customInputNode ? (
                      customInputNode(
                        (value) => updateFieldValue(index(), value),
                        field.value,
                        blocked(),
                      )
                    ) : (
                      <Input
                        name={`${inputName}.${index()}`}
                        thin={thinInputs}
                        value={field.value}
                        onChange={(e) =>
                          updateFieldValue(index(), e.target.value)
                        }
                        disabled={blocked()}
                        class="grow"
                      />
                    )}
                  </div>

                  <Show when={showRemoveButton()}>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={blocked()}
                      class={cn('shrink-0 size-8', thinInputs && 'size-7')}
                      onClick={() => {
                        remove(index());
                      }}
                    >
                      <TrashIcon
                        class="size-4 text-destructive"
                        aria-hidden="true"
                      />
                      <span className="sr-only">{t('Remove')}</span>
                    </Button>
                  </Show>
                </div>
              </SortableItem>
            )}
          </For>
        </Sortable>
      </div>
      <Show when={!blocked()}>
        <Button
          variant="outline"
          size="sm"
          class="mt-3"
          onClick={() => {
            append();
          }}
          type="button"
        >
          <TextWithIcon icon={<Plus size={18} />} text={t('Add Item')} />
        </Button>
      </Show>
    </>
  );
};

ArrayInput.displayName = 'ArrayInput';
export { ArrayInput };
