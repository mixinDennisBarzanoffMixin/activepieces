import { t } from 'i18next';
import { createEffect, createSignal, Show, useContext } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { FieldHeaderContext } from '../utils/utils';

import { useTableState } from './ap-table-state-provider';

const RenameFieldPopoverContent = (props: { name: string }) => {
  const [fields, renameField] = useTableState((state) => [
    state.fields,
    state.renameField,
  ]);
  const [value, setValue] = createSignal('');
  const [error, setError] = createSignal('');
  const fieldHeaderContext = useContext(FieldHeaderContext);
  createEffect(() => {
    setValue(props.name);
  });
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!fieldHeaderContext) {
      return;
    }
    if (value().trim().length === 0) {
      setError(t('Name is required'));
      return;
    }
    if (
      fields.find(
        (field) =>
          field.name.trim().toLowerCase() === value().trim().toLowerCase() &&
          field.name.trim().toLowerCase() !== value().trim().toLowerCase(),
      )
    ) {
      setError(t('Name is already taken'));
      return;
    }

    renameField(fieldHeaderContext.field.index, value());
    fieldHeaderContext.setIsPopoverOpen(false);
  };

  return (
    <Show when={fieldHeaderContext}>
      <form onSubmit={submit} class="flex flex-col gap-2 w-full">
        <div class="space-y-1">
          <Input
            thin={true}
            value={value()}
            onInput={(event) => {
              setValue(event.currentTarget.value);
              setError('');
            }}
          />
          <Show when={error()}>
            <p class="text-sm font-medium text-destructive wrap-break-word">
              {error()}
            </p>
          </Show>
        </div>
        <div class="flex justify-end">
          <Button type="submit" size="sm">
            {t('Rename')}
          </Button>
        </div>
      </form>
    </Show>
  );
};

export default RenameFieldPopoverContent;
