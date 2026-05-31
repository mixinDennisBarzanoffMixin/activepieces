import { t } from 'i18next';
import { createSignal, Show, useContext } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { FieldHeaderContext } from '../utils/utils';

import { useTableState } from './ap-table-state-provider';

const RenameFieldPopoverContent = ({ name }: { name: string }) => {
  const [fields, renameField] = useTableState((state) => [
    state.fields,
    state.renameField,
  ]);
  const [value, setValue] = createSignal(name);
  const [error, setError] = createSignal('');
  const fieldHeaderContext = useContext(FieldHeaderContext);
  if (!fieldHeaderContext) {
    console.error('FieldHeaderContext not found');
    return null;
  }

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (value().trim().length === 0) {
      setError(t('Name is required'));
      return;
    }
    if (
      fields.find(
        (field) =>
          field.name.trim().toLowerCase() === value().trim().toLowerCase() &&
          field.name.trim().toLowerCase() !== name.trim().toLowerCase(),
      )
    ) {
      setError(t('Name is already taken'));
      return;
    }

    renameField(fieldHeaderContext.field.index, value());
    fieldHeaderContext.setIsPopoverOpen(false);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 w-full">
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
      <div className="flex justify-end">
        <Button type="submit" size="sm">
          {t('Rename')}
        </Button>
      </div>
    </form>
  );
};

RenameFieldPopoverContent.displayName = 'RenameFieldPopoverContent';
export default RenameFieldPopoverContent;
