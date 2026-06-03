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

type FormSet = {
  (
    key: 'auth',
    setter: (auth: ProviderForm['auth']) => ProviderForm['auth'],
  ): void;
  (
    key: 'config',
    setter: (cfg: ProviderForm['config']) => ProviderForm['config'],
  ): void;
};

type UpsertProviderConfigFormProps = {
  form: {
    values: ProviderForm;
    set: FormSet;
    errors: Record<string, string>;
  };
  provider: AIProviderName;
  apiKeyRequired?: boolean;
  isLoading?: boolean;
  isEditMode?: boolean;
};

export const UpsertProviderConfigForm = (
  props: UpsertProviderConfigFormProps,
) => {
  const [api, setApi] = createSignal(false);
  const [bedrock, setBedrock] = createSignal(false);
  const showApiKeyInput = () => !props.isEditMode || api();
  const showBedrockAuthInputs = () => !props.isEditMode || bedrock();
  const append = (model: ProviderModelConfig) =>
    props.form.set('config', (cfg) => ({
      ...cfg,
      models: [...getModels(cfg), model],
    }));
  const update = (index: number, model: ProviderModelConfig) =>
    props.form.set('config', (cfg) => ({
      ...cfg,
      models: getModels(cfg).map((item, idx) => (idx === index ? model : item)),
    }));
  const remove = (index: number) =>
    props.form.set('config', (cfg) => ({
      ...cfg,
      models: getModels(cfg).filter((_, idx) => idx !== index),
    }));

  return (
    <div class="grid space-y-4">
      <Show when={props.provider !== AIProviderName.BEDROCK}>
        <div class="grid space-y-3">
          <div class="flex items-center justify-between">
            <Label for="apiKey">
              <Show
                when={props.provider === AIProviderName.CLOUDFLARE_GATEWAY}
                fallback={t('API Key')}
              >
                {t('AI Gateway Token')}
              </Show>
            </Label>
            <Show when={!showApiKeyInput()}>
              <Button
                type="button"
                variant="basic"
                size="sm"
                onClick={() => setApi(true)}
                disabled={props.isLoading}
              >
                <Pencil class="h-4 w-4 mr-2" />
                {t('Edit')}
              </Button>
            </Show>
          </div>
          <Show when={showApiKeyInput()}>
            <Input
              value={getAuth(props.form.values.auth, 'apiKey')}
              onInput={(e) =>
                setAuth(props.form, 'apiKey', e.currentTarget.value)
              }
              required={props.apiKeyRequired ?? true}
              id="apiKey"
              placeholder={'sk_************************'}
              disabled={props.isLoading}
            />
          </Show>
          <FieldError message={props.form.errors['auth.apiKey']} />
        </div>
      </Show>

      <Show when={props.provider === AIProviderName.AZURE}>
        <>
          <div class="grid space-y-3">
            <Label for="resourceName">{t('Resource Name')}</Label>
            <Input
              value={getConfig(props.form.values.config, 'resourceName')}
              onInput={(e) =>
                setConfig(props.form, 'resourceName', e.currentTarget.value)
              }
              required
              id="resourceName"
              placeholder={'your-resource-name'}
              disabled={props.isLoading}
            />
            <FieldError message={props.form.errors['config.resourceName']} />
          </div>

          <div class="grid space-y-3">
            <Label for="apiVersion">{t('API Version')}</Label>
            <Input
              value={getConfig(props.form.values.config, 'apiVersion')}
              onInput={(e) =>
                setConfig(props.form, 'apiVersion', e.currentTarget.value)
              }
              id="apiVersion"
              placeholder={'2024-10-21'}
              disabled={props.isLoading}
            />
            <p class="text-sm text-muted-foreground">
              {t(
                'Optional. Leave empty to use the default. Some Azure resources require a different version, e.g. 2023-03-15-preview.',
              )}
            </p>
            <FieldError message={props.form.errors['config.apiVersion']} />
          </div>
        </>
      </Show>

      <Show when={props.provider === AIProviderName.CLOUDFLARE_GATEWAY}>
        <>
          <div class="grid space-y-3">
            <Label for="accountId">{t('Account ID')}</Label>
            <Input
              value={getConfig(props.form.values.config, 'accountId')}
              onInput={(e) =>
                setConfig(props.form, 'accountId', e.currentTarget.value)
              }
              required
              id="accountId"
              placeholder={'your-account-id'}
              disabled={props.isLoading}
            />
            <FieldError message={props.form.errors['config.accountId']} />
          </div>

          <div class="grid space-y-3">
            <Label for="gatewayId">{t('Gateway ID')}</Label>
            <Input
              value={getConfig(props.form.values.config, 'gatewayId')}
              onInput={(e) =>
                setConfig(props.form, 'gatewayId', e.currentTarget.value)
              }
              required
              id="gatewayId"
              placeholder={'your-gateway-id'}
              disabled={props.isLoading}
            />
            <FieldError message={props.form.errors['config.gatewayId']} />
          </div>
          <div class="grid space-y-3">
            <Label for="vertexRegion">
              {t('Google Vertex Project Region')}
            </Label>
            <Input
              value={getConfig(props.form.values.config, 'vertexRegion')}
              onInput={(e) =>
                setConfig(props.form, 'vertexRegion', e.currentTarget.value)
              }
              id="vertexRegion"
              placeholder={'global'}
              disabled={props.isLoading}
            />
            <FieldError message={props.form.errors['config.vertexRegion']} />
          </div>
          <div class="grid space-y-3">
            <Label for="vertexProjectId">{t('Google Vertex Project ID')}</Label>
            <Input
              value={getConfig(props.form.values.config, 'vertexProject')}
              onInput={(e) =>
                setConfig(props.form, 'vertexProject', e.currentTarget.value)
              }
              id="vertexProjectId"
              placeholder={'project-1234'}
              disabled={props.isLoading}
            />
            <FieldError message={props.form.errors['config.vertexProject']} />
          </div>
        </>
      </Show>

      <Show when={props.provider === AIProviderName.BEDROCK}>
        <>
          <Show when={!showBedrockAuthInputs()}>
            <div class="flex items-center justify-between">
              <Label class="text-sm font-medium">{t('AWS Credentials')}</Label>
              <Button
                type="button"
                variant="basic"
                size="sm"
                onClick={() => setBedrock(true)}
                disabled={props.isLoading}
              >
                <Pencil class="h-4 w-4 mr-2" />
                {t('Edit')}
              </Button>
            </div>
          </Show>

          <Show when={showBedrockAuthInputs()}>
            <>
              <div class="grid space-y-3">
                <Label for="accessKeyId">{t('AWS Access Key ID')}</Label>
                <Input
                  value={getAuth(props.form.values.auth, 'accessKeyId')}
                  onInput={(e) =>
                    setAuth(props.form, 'accessKeyId', e.currentTarget.value)
                  }
                  required={props.apiKeyRequired ?? true}
                  id="accessKeyId"
                  placeholder={'AKIA************'}
                  disabled={props.isLoading}
                />
                <FieldError message={props.form.errors['auth.accessKeyId']} />
              </div>

              <div class="grid space-y-3">
                <Label for="secretAccessKey">
                  {t('AWS Secret Access Key')}
                </Label>
                <Input
                  value={getAuth(props.form.values.auth, 'secretAccessKey')}
                  onInput={(e) =>
                    setAuth(
                      props.form,
                      'secretAccessKey',
                      e.currentTarget.value,
                    )
                  }
                  type="password"
                  required={props.apiKeyRequired ?? true}
                  id="secretAccessKey"
                  placeholder={'****************************************'}
                  disabled={props.isLoading}
                />
                <FieldError
                  message={props.form.errors['auth.secretAccessKey']}
                />
              </div>
            </>
          </Show>

          <div class="grid space-y-3">
            <Label for="region">{t('AWS Region')}</Label>
            <Select
              value={getConfig(props.form.values.config, 'region')}
              onValueChange={(val: string) =>
                setConfig(props.form, 'region', val)
              }
              disabled={props.isLoading}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder={String(t('Select a region'))} />
              </SelectTrigger>
              <SelectContent>
                <For each={AWS_BEDROCK_REGIONS}>
                  {(region) => (
                    <SelectItem key={region.value} value={String(region.value)}>
                      {String(region.label)}
                    </SelectItem>
                  )}
                </For>
              </SelectContent>
            </Select>
            <FieldError message={props.form.errors['config.region']} />
          </div>
        </>
      </Show>

      <Show when={props.provider === AIProviderName.CUSTOM}>
        <>
          <div class="grid space-y-3">
            <Label for="baseUrl">{t('Base URL')}</Label>
            <Input
              value={getConfig(props.form.values.config, 'baseUrl')}
              onInput={(e) =>
                setConfig(props.form, 'baseUrl', e.currentTarget.value)
              }
              required
              id="baseUrl"
              placeholder={'your-base-url'}
              disabled={props.isLoading}
            />
            <FieldError message={props.form.errors['config.baseUrl']} />
          </div>

          <div class="grid space-y-3">
            <Label for="apiKeyHeader">{t('API Key Header')}</Label>
            <Input
              value={getConfig(props.form.values.config, 'apiKeyHeader')}
              onInput={(e) =>
                setConfig(props.form, 'apiKeyHeader', e.currentTarget.value)
              }
              required
              id="apiKeyHeader"
              placeholder={'your-api-key-header'}
              disabled={props.isLoading}
            />
            <FieldError message={props.form.errors['config.apiKeyHeader']} />
          </div>

          <div class="space-y-3">
            <Label class="text-sm font-medium">{t('Custom Headers')}</Label>
            <DictionaryInput
              values={getHeaders(props.form.values.config)}
              onChange={(headers) =>
                setConfig(props.form, 'defaultHeaders', headers)
              }
              disabled={props.isLoading}
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
        ].includes(props.provider)}
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <Label class="text-base">{t('Models Configuration')}</Label>
            <ModelFormPopover onSubmit={(model) => append(model)}>
              <Button
                type="button"
                size="sm"
                variant="basic"
                disabled={props.isLoading}
              >
                <Plus class="h-4 w-4 mr-2" />
                {t('Add Model')}
              </Button>
            </ModelFormPopover>
          </div>

          <Show
            when={getModels(props.form.values.config).length === 0}
            fallback={
              <div class="space-y-3">
                <For each={getModels(props.form.values.config)}>
                  {(field, index) => (
                    <ProviderConfigModelItem
                      model={field}
                      isLoading={props.isLoading}
                      onUpdate={(model) => update(index(), model)}
                      onRemove={() => remove(index())}
                    />
                  )}
                </For>
              </div>
            }
          >
            <div class="text-center py-8 border border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
              <span class="mb-2 flex justify-center text-muted-foreground">
                <AlertCircle class="h-8 w-8 mx-auto" />
              </span>
              <p class="text-sm text-muted-foreground">
                {t(
                  'This provider does not support listing models via API, please add models manually.',
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

const ProviderConfigModelItem = (props: ProviderConfigModelItemProps) => {
  return (
    <div class="flex items-center justify-between p-4 border rounded-lg transition-colors">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <ModelTypeIcon modelType={props.model.modelType} />
          <div class="flex flex-col gap-0">
            <p class="text-sm">{props.model.modelName}</p>
            <p class="text-sm text-muted-foreground">{props.model.modelId}</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <ModelFormPopover
          initialData={props.model}
          onSubmit={(updatedModel) => props.onUpdate(updatedModel)}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={props.isLoading}
          >
            <Pencil class="h-4 w-4" />
            <span class="sr-only">{t('Edit')}</span>
          </Button>
        </ModelFormPopover>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => props.onRemove()}
          disabled={props.isLoading}
        >
          <Trash2 class="h-4 w-4 text-destructive" />
          <span class="sr-only">{t('Delete')}</span>
        </Button>
      </div>
    </div>
  );
};

const ModelTypeIcon = (props: { modelType: AIProviderModelType }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Show
          when={props.modelType === AIProviderModelType.IMAGE}
          fallback={<TextIcon class="size-8" />}
        >
          <ImageIcon class="size-8" />
        </Show>
      </TooltipTrigger>
      <TooltipContent>
        <Show
          when={props.modelType === AIProviderModelType.IMAGE}
          fallback={t('Text Model')}
        >
          {t('Image Model')}
        </Show>
      </TooltipContent>
    </Tooltip>
  );
};

const FieldError = (props: { message?: string }) => (
  <Show when={props.message}>
    <p class="text-sm font-medium text-destructive wrap-break-word">
      {t(props.message ?? '')}
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
  value: string,
) => form.set('auth', (auth) => ({ ...auth, [key]: value }));

const setConfig = (
  form: UpsertProviderConfigFormProps['form'],
  key: keyof AIProviderConfig,
  value: string | Record<string, string>,
) => form.set('config', (cfg) => ({ ...cfg, [key]: value }));
