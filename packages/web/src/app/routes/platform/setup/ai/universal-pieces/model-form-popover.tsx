import { AIProviderModelType, ProviderModelConfig } from '@activepieces/shared';
import { t } from 'i18next';
import { createSignal, For, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type ModelFormPopoverProps = {
  initialData?: ProviderModelConfig;
  onSubmit: (model: ProviderModelConfig) => void;
  children: JSX.Element;
};

const ModelFormPopover = (props: ModelFormPopoverProps) => {
  const [open, setOpen] = createSignal(false);
  const types = Object.values(AIProviderModelType);
  const defaultModel: ProviderModelConfig = {
    modelId: '',
    modelName: '',
    modelType: AIProviderModelType.TEXT,
  };

  const [model, setModel] = createSignal<ProviderModelConfig>(
    props.initialData || defaultModel,
  );

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    // so parent form doesn't submit
    e.stopPropagation();
    props.onSubmit(model());
    if (!props.initialData) {
      setModel(defaultModel);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{props.children}</PopoverTrigger>
      <PopoverContent class="w-80">
        <div class="grid gap-4">
          <div class="space-y-2">
            <h4 class="font-medium leading-none">
              <Show when={props.initialData} fallback={t('Add Model')}>
                {t('Edit Model')}
              </Show>
            </h4>
            <p class="text-sm text-muted-foreground">
              {t('Configure the model settings')}
            </p>
          </div>
          <form onSubmit={handleSubmit} class="space-y-4">
            <div class="space-y-2">
              <Label for="modelId">{t('Model ID')}</Label>
              <Input
                id="modelId"
                value={model().modelId}
                onChange={(e) =>
                  setModel({ ...model(), modelId: e.currentTarget.value })
                }
                placeholder="e.g., gpt-4"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="modelName">{t('Model Name')}</Label>
              <Input
                id="modelName"
                value={model().modelName}
                onChange={(e) =>
                  setModel({ ...model(), modelName: e.currentTarget.value })
                }
                placeholder="e.g., GPT-4"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="modelType">{t('Model Type')}</Label>
              <Select
                value={model().modelType}
                onValueChange={(value: string) =>
                  setModel({
                    ...model(),
                    modelType:
                      types.find((type) => String(type) === value) ??
                      AIProviderModelType.TEXT,
                  })
                }
              >
                <SelectTrigger id="modelType">
                  <SelectValue placeholder={'Select model type'} />
                </SelectTrigger>
                <SelectContent>
                  <For each={Object.values(AIProviderModelType)}>
                    {(type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    )}
                  </For>
                </SelectContent>
              </Select>
            </div>

            <div class="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit">
                <Show when={props.initialData} fallback={t('Add')}>
                  {t('Update')}
                </Show>
              </Button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { ModelFormPopover };
