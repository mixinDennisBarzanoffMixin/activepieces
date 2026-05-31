import { FieldType, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { nanoid } from 'nanoid';
import { createSignal, For, Show } from 'solid-js';

import { ArrayInput } from '@/components/custom/array-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTableState } from '@/features/tables/components/ap-table-state-provider';
import { tablesUtils } from '@/features/tables/utils/utils';
import { cn } from '@/lib/utils';

type NewFieldDialogProps = {
  children: any;
};

const FIELD_TYPE_FRIENDLY_NAME: Record<FieldType, string> = {
  [FieldType.TEXT]: 'Text',
  [FieldType.NUMBER]: 'Number',
  [FieldType.DATE]: 'Date',
  [FieldType.STATIC_DROPDOWN]: 'Dropdown',
};

export function NewFieldPopup({ children }: NewFieldDialogProps) {
  const [open, setOpen] = createSignal(false);
  const [name, setName] = createSignal('');
  const [type, setType] = createSignal<FieldType>(FieldType.TEXT);
  const [options, setOptions] = createSignal<string[]>(['']);
  const [errors, setErrors] = createSignal<NewFieldErrors>({});
  const fields = useTableState((state) => state.fields);
  const createField = useTableState((state) => state.createField);

  const reset = () => {
    setName('');
    setType(FieldType.TEXT);
    setOptions(['']);
    setErrors({});
  };

  const validate = () => {
    const next: NewFieldErrors = {};
    if (name().trim().length === 0) {
      next.name = t('Name is required');
    } else if (fields?.find((field) => field.name.trim() === name().trim())) {
      next.name = t('Name must be unique');
    }
    if (isNil(type())) {
      next.type = t('Type is required');
    }
    if (
      type() === FieldType.STATIC_DROPDOWN &&
      (options().length === 0 ||
        !options().some((option) => option.trim().length > 0))
    ) {
      next.options = t('Please add at least one option');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setOpen(false);
    if (type() === FieldType.STATIC_DROPDOWN) {
      createField({
        uuid: nanoid(),
        name: name(),
        type: type(),
        data: {
          options: options()
            .filter((option) => option.length > 0)
            .map((option) => ({
              value: option,
            })),
        },
      });
      reset();
      return;
    }

    createField({
      uuid: nanoid(),
      name: name(),
      type: type(),
    });
    reset();
  };

  return (
    <Popover open={open} modal={false} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent class="w-[400px] py-4 px-2 drop-shadow-xl">
        <div className="text-lg font-semibold mb-4 px-3">{t('New Field')}</div>

        <form onSubmit={submit} className="mx-2">
          <div className="max-h-[80vh]  overflow-y-auto space-y-4 px-1 ">
              <div class="grid space-y-3">
                <Label for="name">{t('Name')}</Label>
                <Input
                  thin={true}
                  id="name"
                  value={name()}
                  onInput={(event) => setName(event.currentTarget.value)}
                />
                <Show when={errors().name}>
                  <p class="text-sm font-medium text-destructive wrap-break-word">
                    {errors().name}
                  </p>
                </Show>
              </div>
              <div class="grid space-y-2">
                <Label>{t('Type')}</Label>
                <ScrollArea class="max-h-[200px] rounded-md border">
                  <RadioGroup
                    value={type()}
                    onValueChange={(value) => {
                      const next = Object.values(FieldType).find(
                        (item) => item === value,
                      );
                      if (next) setType(next);
                    }}
                    class="p-1"
                  >
                    <For each={Object.values(FieldType)}>
                      {(item) => (
                        <div className="flex items-center">
                          <RadioGroupItem
                            value={item}
                            id={item}
                            class="sr-only"
                          />
                          <Label
                            for={item}
                            class={cn(
                              'flex items-center gap-2 w-full px-3 py-2 rounded-sm',
                              'text-left text-accent-foreground cursor-pointer hover:bg-muted',
                              type() === item && 'bg-muted text-primary',
                            )}
                          >
                            {tablesUtils.getColumnIcon(item)}
                            {FIELD_TYPE_FRIENDLY_NAME[item]
                              ? t(FIELD_TYPE_FRIENDLY_NAME[item])
                              : t(item)}
                          </Label>
                        </div>
                      )}
                    </For>
                  </RadioGroup>
                </ScrollArea>
                <Show when={errors().type}>
                  <p class="text-sm font-medium text-destructive wrap-break-word">
                    {errors().type}
                  </p>
                </Show>
              </div>
              <Show when={type() === FieldType.STATIC_DROPDOWN}>
                <div class="grid space-y-3">
                  <Label>{t('Options')}</Label>
                  <ArrayInput
                    inputName="data.options"
                    disabled={false}
                    required={true}
                    thinInputs={true}
                    value={options()}
                    onChange={setOptions}
                  />
                  <Show when={errors().options}>
                    <p class="text-sm font-medium text-destructive wrap-break-word">
                      {errors().options}
                    </p>
                  </Show>
                </div>
              </Show>
          </div>
          <div className="flex justify-end gap-2 pt-2 mt-3">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" size="sm">
                {t('Create')}
              </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

type NewFieldErrors = {
  name?: string;
  type?: string;
  options?: string;
};
