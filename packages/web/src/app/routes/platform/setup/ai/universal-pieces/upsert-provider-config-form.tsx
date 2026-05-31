import {
  AIProviderAuthConfig,
  AIProviderConfig,
  AIProviderName,
  AIProviderModelType,
  ProviderModelConfig,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  TextIcon,
  AlertCircle,
} from 'lucide-solid';
import { createSignal, For, Show } from 'solid-js';
import { SetStoreFunction } from 'solid-js/store';

import { DictionaryInput } from '@/components/custom/dictionary-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AWS_BEDROCK_REGIONS } from '@/features/agents/aws-regions';

import { ModelFormPopover } from './model-form-popover';
import type { ProviderForm } from './upsert-provider-dialog';

type UpsertProviderConfigFormProps = {
  form: {
    values: ProviderForm;
    set: SetStoreFunction<ProviderForm>;
    errors: Record<string, string>;
  };
  provider: AIProviderName;
  apiKeyRequired?: boolean;
  isLoading?: boolean;
  isEditMode?: boolean;
};

export const UpsertProviderConfigForm = ({
  form,
  provider,
  apiKeyRequired = true,
  isLoading,
  isEditMode = false,
}: UpsertProviderConfigFormProps) => {
  const [showApiKeyInput, setShowApiKeyInput] = createSignal(!isEditMode);
  const [showBedrockAuthInputs, setShowBedrockAuthInputs] = createSignal(
    !isEditMode
  );
  const append = (model: ProviderModelConfig) =>
    form.set('config', (cfg) => ({
      ...cfg,
      models: [...getModels(cfg), model],
    }));
  const update = (index: number, model: ProviderModelConfig) =>
    form.set('config', (cfg) => ({
      ...cfg,
      models: getModels(cfg).map((item, idx) => (idx === index ? model : item)),
    }));
  const remove = (index: number) =>
    form.set('config', (cfg) => ({
      ...cfg,
      models: getModels(cfg).filter((_, idx) => idx !== index),
    }));

  return (
    <div className="grid space-y-4">
      <Show when={provider !== AIProviderName.BEDROCK}>
        <div class="grid space-y-3">
          <div className="flex items-center justify-between">
            <Label for="apiKey">
              <Show
                when={provider === AIProviderName.CLOUDFLARE_GATEWAY}
                fallback={t('API Key')}
              >
                t('AI Gateway Token'
              </Show>
            </Label>
            <Show when={!showApiKeyInput}>
              <Button
                type="button"
                variant="basic"
                size="sm"
                onClick={() => setShowApiKeyInput(true)}
                disabled={isLoading}
              >
                <Pencil class="h-4 w-4 mr-2" />
                {t('Edit')}
              </Button>
            </Show>
          </div>
          <Show when={showApiKeyInput}>
            <Input
              value={getAuth(form.values.auth, 'apiKey')}
              onInput={(e) => setAuth(form, 'apiKey', e.currentTarget.value)}
              required={apiKeyRequired}
              id="apiKey"
              placeholder={'sk_************************'}
              disabled={isLoading}
            />
          </Show>
          <FieldError message={form.errors['auth.apiKey']} />
        </div>
      </Show>

      <Show when={provider === AIProviderName.AZURE}>
        <>
          <div class="grid space-y-3">
            <Label for="resourceName">{t('Resource Name')}</Label>
            <Input
              value={getConfig(form.values.config, 'resourceName')}
              onInput={(e) =>
                setConfig(form, 'resourceName', e.currentTarget.value)
              }
              required
              id="resourceName"
              placeholder={'your-resource-name'}
              disabled={isLoading}
            />
            <FieldError message={form.errors['config.resourceName']} />
          </div>

          <div class="grid space-y-3">
            <Label for="apiVersion">{t('API Version')}</Label>
            <Input
              value={getConfig(form.values.config, 'apiVersion')}
              onInput={(e) =>
                setConfig(form, 'apiVersion', e.currentTarget.value)
              }
              id="apiVersion"
              placeholder={'2024-10-21'}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              {t(
                'Optional. Leave empty to use the default. Some Azure resources require a different version, e.g. 2023-03-15-preview.'
              )}
            </p>
            <FieldError message={form.errors['config.apiVersion']} />
          </div>
        </>
      </Show>

      <Show when={provider === AIProviderName.CLOUDFLARE_GATEWAY}>
        <>
          <div class="grid space-y-3">
            <Label for="accountId">{t('Account ID')}</Label>
            <Input
              value={getConfig(form.values.config, 'accountId')}
              onInput={(e) =>
                setConfig(form, 'accountId', e.currentTarget.value)
              }
              required
              id="accountId"
              placeholder={'your-account-id'}
              disabled={isLoading}
            />
            <FieldError message={form.errors['config.accountId']} />
          </div>

          <div class="grid space-y-3">
            <Label for="gatewayId">{t('Gateway ID')}</Label>
            <Input
              value={getConfig(form.values.config, 'gatewayId')}
              onInput={(e) =>
                setConfig(form, 'gatewayId', e.currentTarget.value)
              }
              required
              id="gatewayId"
              placeholder={'your-gateway-id'}
              disabled={isLoading}
            />
            <FieldError message={form.errors['config.gatewayId']} />
          </div>
          <div class="grid space-y-3">
            <Label for="vertexRegion">
              {t('Google Vertex Project Region')}
            </Label>
            <Input
              value={getConfig(form.values.config, 'vertexRegion')}
              onInput={(e) =>
                setConfig(form, 'vertexRegion', e.currentTarget.value)
              }
              id="vertexRegion"
              placeholder={'global'}
              disabled={isLoading}
            />
            <FieldError message={form.errors['config.vertexRegion']} />
          </div>
          <div class="grid space-y-3">
            <Label for="vertexProjectId">{t('Google Vertex Project ID')}</Label>
            <Input
              value={getConfig(form.values.config, 'vertexProject')}
              onInput={(e) =>
                setConfig(form, 'vertexProject', e.currentTarget.value)
              }
              id="vertexProjectId"
              placeholder={'project-1234'}
              disabled={isLoading}
            />
            <FieldError message={form.errors['config.vertexProject']} />
          </div>
        </>
      </Show>

      <Show when={provider === AIProviderName.BEDROCK}>
        <>
          <Show when={!showBedrockAuthInputs}>
            <div className="flex items-center justify-between">
              <Label class="text-sm font-medium">{t('AWS Credentials')}</Label>
              <Button
                type="button"
                variant="basic"
                size="sm"
                onClick={() => setShowBedrockAuthInputs(true)}
                disabled={isLoading}
              >
                <Pencil class="h-4 w-4 mr-2" />
                {t('Edit')}
              </Button>
            </div>
          </Show>

          <Show when={showBedrockAuthInputs}>
            <>
              <div class="grid space-y-3">
                <Label for="accessKeyId">{t('AWS Access Key ID')}</Label>
                <Input
                  value={getAuth(form.values.auth, 'accessKeyId')}
                  onInput={(e) =>
                    setAuth(form, 'accessKeyId', e.currentTarget.value)
                  }
                  required={apiKeyRequired}
                  id="accessKeyId"
                  placeholder={'AKIA************'}
                  disabled={isLoading}
                />
                <FieldError message={form.errors['auth.accessKeyId']} />
              </div>

              <div class="grid space-y-3">
                <Label for="secretAccessKey">
                  {t('AWS Secret Access Key')}
                </Label>
                <Input
                  value={getAuth(form.values.auth, 'secretAccessKey')}
                  onInput={(e) =>
                    setAuth(form, 'secretAccessKey', e.currentTarget.value)
                  }
                  type="password"
                  required={apiKeyRequired}
                  id="secretAccessKey"
                  placeholder={'****************************************'}
                  disabled={isLoading}
                />
                <FieldError message={form.errors['auth.secretAccessKey']} />
              </div>
            </>
          </Show>

          <div class="grid space-y-3">
            <Label for="region">{t('AWS Region')}</Label>
            <Select
              value={getConfig(form.values.config, 'region')}
              onValueChange={(val) => setConfig(form, 'region', val)}
              disabled={isLoading}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder={t('Select a region')} />
              </SelectTrigger>
              <SelectContent>
                <For each={AWS_BEDROCK_REGIONS}>
                  {(region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  )}
                </For>
              </SelectContent>
            </Select>
            <FieldError message={form.errors['config.region']} />
          </div>
        </>
      </Show>

      <Show when={provider === AIProviderName.CUSTOM}>
        <>
          <div class="grid space-y-3">
            <Label for="baseUrl">{t('Base URL')}</Label>
            <Input
              value={getConfig(form.values.config, 'baseUrl')}
              onInput={(e) => setConfig(form, 'baseUrl', e.currentTarget.value)}
              required
              id="baseUrl"
              placeholder={'your-base-url'}
              disabled={isLoading}
            />
            <FieldError message={form.errors['config.baseUrl']} />
          </div>

          <div class="grid space-y-3">
            <Label for="apiKeyHeader">{t('API Key Header')}</Label>
            <Input
              value={getConfig(form.values.config, 'apiKeyHeader')}
              onInput={(e) =>
                setConfig(form, 'apiKeyHeader', e.currentTarget.value)
              }
              required
              id="apiKeyHeader"
              placeholder={'your-api-key-header'}
              disabled={isLoading}
            />
            <FieldError message={form.errors['config.apiKeyHeader']} />
          </div>

          <div className="space-y-3">
            <Label class="text-sm font-medium">{t('Custom Headers')}</Label>
            <DictionaryInput
              values={getHeaders(form.values.config)}
              onChange={(headers) => setConfig(form, 'defaultHeaders', headers)}
              disabled={isLoading}
              keyPlaceholder={t('Header name')}
              valuePlaceholder={t('Header value')}
            />
          </div>
        </>
      </Show>

      <Show
        when={[
          AIProviderName.CUSTOM,
          AIProviderName.CLOUDFLARE_GATEWAY,
        ].includes(provider)}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label class="text-base">{t('Models Configuration')}</Label>
            <ModelFormPopover onSubmit={(model) => append(model)}>
              <Button
                type="button"
                size="sm"
                variant="basic"
                disabled={isLoading}
              >
                <Plus class="h-4 w-4 mr-2" />
                {t('Add Model')}
              </Button>
            </ModelFormPopover>
          </div>

          <Show
            when={getModels(form.values.config).length === 0}
            fallback={
              <div className="space-y-3">
                <For each={getModels(form.values.config)}>
                  {(field, index) => (
                    <ProviderConfigModelItem
                      model={field}
                      isLoading={isLoading}
                      onUpdate={(model) => update(index(), model)}
                      onRemove={() => remove(index())}
                    />
                  )}
                </For>
              </div>
            }
          >
            <div className="text-center py-8 border border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
              <span className="mb-2 flex justify-center text-muted-foreground">
                <AlertCircle class="h-8 w-8 mx-auto" />
              </span>
              <p className="text-sm text-muted-foreground">
                {t(
                  'This provider does not support listing models via API, please add models manually.'
                )}
              </p>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

type ProviderConfigModelItemProps = {
  model: ProviderModelConfig;
  isLoading?: boolean;
  onUpdate: (model: ProviderModelConfig) => void;
  onRemove: () => void;
};

const ProviderConfigModelItem = ({
  model,
  isLoading,
  onUpdate,
  onRemove,
}: ProviderConfigModelItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <ModelTypeIcon modelType={model.modelType} />
          <div className="flex flex-col gap-0">
            <p className="text-sm">{model.modelName}</p>
            <p className="text-sm text-muted-foreground">{model.modelId}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ModelFormPopover
          initialData={model}
          onSubmit={(updatedModel) => onUpdate(updatedModel)}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLoading}
          >
            <Pencil class="h-4 w-4" />
            <span className="sr-only">{t('Edit')}</span>
          </Button>
        </ModelFormPopover>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove()}
          disabled={isLoading}
        >
          <Trash2 class="h-4 w-4 text-destructive" />
          <span className="sr-only">{t('Delete')}</span>
        </Button>
      </div>
    </div>
  );
};

const ModelTypeIcon = ({ modelType }: { modelType: AIProviderModelType }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Show
          when={modelType === AIProviderModelType.IMAGE}
          fallback={<TextIcon class="size-8" />}
        >
          <ImageIcon class="size-8" />
        </Show>
      </TooltipTrigger>
      <TooltipContent>
        <Show
          when={modelType === AIProviderModelType.IMAGE}
          fallback={t('Text Model')}
        >
          t('Image Model'
        </Show>
      </TooltipContent>
    </Tooltip>
  );
};

const FieldError = ({ message }: { message?: string }) => (
  <Show when={message}>
    <p class="text-sm font-medium text-destructive wrap-break-word">
      {t(message ?? '')}
    </p>
  </Show>
);

const getAuth = (auth: AIProviderAuthConfig, key: string) =>
  typeof auth[key as keyof AIProviderAuthConfig] === 'string'
    ? String(auth[key as keyof AIProviderAuthConfig])
    : '';

const getConfig = (cfg: AIProviderConfig, key: string) =>
  typeof cfg[key as keyof AIProviderConfig] === 'string'
    ? String(cfg[key as keyof AIProviderConfig])
    : '';

const getHeaders = (cfg: AIProviderConfig) =>
  'defaultHeaders' in cfg ? cfg.defaultHeaders ?? {} : {};

const getModels = (cfg: AIProviderConfig) =>
  'models' in cfg ? cfg.models : [];

const setAuth = (
  form: UpsertProviderConfigFormProps['form'],
  key: keyof AIProviderAuthConfig,
  value: string
) => form.set('auth', (auth) => ({ ...auth, [key]: value }));

const setConfig = (
  form: UpsertProviderConfigFormProps['form'],
  key: keyof AIProviderConfig,
  value: string | Record<string, string>
) => form.set('config', (cfg) => ({ ...cfg, [key]: value }));
