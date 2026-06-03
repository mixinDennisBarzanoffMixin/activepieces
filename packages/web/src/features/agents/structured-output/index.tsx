import { AgentOutputFieldType, AgentOutputField } from '@activepieces/shared';
import { t } from 'i18next';
import { X } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { AddFieldPopover } from './add-field-popover';
import { FieldTypeIcon } from './field-type-icon';

export const AgentStructuredOutput = (props: {
  structuredOutputField: StructuredOutputField;
  disabled: boolean;
}) => {
  const outputFields = () => {
    const value = props.structuredOutputField.value;
    return Array.isArray(value) ? (value as AgentOutputField[]) : [];
  };

  const handleAddField = (
    type: AgentOutputFieldType,
    name: string,
    description: string,
  ) => {
    const newField = { displayName: name, description, type };
    props.structuredOutputField.onInput([...outputFields(), newField]);
  };

  const handleRemoveField = (displayName: string) => {
    const newFields = outputFields().filter(
      (f) => f.displayName !== displayName,
    );
    props.structuredOutputField.onInput(newFields);
  };

  return (
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-sm font-medium">{t('Structured Output')}</h2>
      </div>

      <div class="flex flex-col gap-2 mt-4">
        <Show
          when={outputFields().length > 0}
          fallback={
            <div class="text-muted-foreground text-sm">
              {t('No structured output fields yet.')}
            </div>
          }
        >
          <Card>
            <CardContent class="px-2 py-2">
              <div class="flex flex-col gap-3">
                <For each={outputFields()}>
                  {(field) => (
                    <div class="flex items-center justify-between">
                      <div class="grid grid-cols-12 gap-2 w-full items-center">
                        <div class="col-span-1 flex items-center justify-center h-full">
                          <FieldTypeIcon type={field.type} class="h-4 w-4" />
                        </div>
                        <div class="col-span-10 flex flex-col justify-center">
                          <span class="font-medium text-sm">
                            {field.displayName}
                          </span>
                          <Show when={field.description}>
                            <span class="text-xs text-muted-foreground">
                              {field.description}
                            </span>
                          </Show>
                        </div>
                        <div class="col-span-1 flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveField(field.displayName)}
                            disabled={props.disabled}
                          >
                            <X class="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </CardContent>
          </Card>
        </Show>
        <AddFieldPopover
          disabled={props.disabled}
          onAddField={handleAddField}
        />
      </div>
    </div>
  );
};

type StructuredOutputField = {
  value: unknown;
  onInput: (value: AgentOutputField[]) => void;
};
