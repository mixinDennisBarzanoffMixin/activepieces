import { AgentOutputFieldType } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-solid';
import { createSignal } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { FieldTypeIcon } from './field-type-icon';

interface AddFieldPopoverProps {
  onAddField: (
    type: AgentOutputFieldType,
    name: string,
    description: string,
  ) => void;
  disabled: boolean;
}

export const AddFieldPopover = (props: AddFieldPopoverProps) => {
  const [fieldType, setFieldType] = createSignal<
    AgentOutputFieldType | undefined
  >(undefined);
  const [fieldName, setFieldName] = createSignal('');
  const [fieldDescription, setFieldDescription] = createSignal('');
  const [open, setOpen] = createSignal(false);

  const handleAdd = () => {
    const name = fieldName().trim();
    const desc = fieldDescription().trim();
    if (fieldType() && name && desc) {
      props.onAddField(fieldType()!, name, desc);
      setFieldType(undefined);
      setFieldName('');
      setFieldDescription('');
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" class="w-full" disabled={props.disabled}>
          <Plus class="h-4 w-4 mr-2" />
          {t('Add Field')}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80" side="bottom" align="center" sideOffset={10}>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Field Type</label>
            <Select
              value={fieldType()}
              onValueChange={(value) =>
                setFieldType(value as AgentOutputFieldType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AgentOutputFieldType.TEXT}>
                  <div class="flex items-center">
                    <FieldTypeIcon
                      type={AgentOutputFieldType.TEXT}
                      class="h-4 w-4 mr-2 text-muted-foreground"
                    />
                    <span>Text</span>
                  </div>
                </SelectItem>
                <SelectItem value={AgentOutputFieldType.NUMBER}>
                  <div class="flex items-center">
                    <FieldTypeIcon
                      type={AgentOutputFieldType.NUMBER}
                      class="h-4 w-4 mr-2 text-muted-foreground"
                    />
                    <span>Number</span>
                  </div>
                </SelectItem>
                <SelectItem value={AgentOutputFieldType.BOOLEAN}>
                  <div class="flex items-center">
                    <FieldTypeIcon
                      type={AgentOutputFieldType.BOOLEAN}
                      class="h-4 w-4 mr-2 text-muted-foreground"
                    />
                    <span>Yes/No</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Field Name</label>
            <Input
              id="field-name"
              placeholder="Enter field name"
              value={fieldName()}
              onInput={(e) => setFieldName(e.currentTarget.value)}
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Field Description</label>
            <Input
              id="field-description"
              placeholder="Enter field description"
              value={fieldDescription()}
              onInput={(e) => setFieldDescription(e.currentTarget.value)}
            />
          </div>
          <Button
            class="w-full"
            onClick={handleAdd}
            variant={'default'}
            disabled={
              !fieldType() || !fieldName().trim() || !fieldDescription().trim()
            }
          >
            Add
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
