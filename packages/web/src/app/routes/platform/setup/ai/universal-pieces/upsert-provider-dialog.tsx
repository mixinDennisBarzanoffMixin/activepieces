import {
  AIProviderConfig,
  AIProviderName,
  AnthropicProviderAuthConfig,
  AnthropicProviderConfig,
  AIProviderAuthConfig,
  AzureProviderAuthConfig,
  AzureProviderConfig,
  BedrockProviderAuthConfig,
  BedrockProviderConfig,
  CloudflareGatewayProviderAuthConfig,
  CloudflareGatewayProviderConfig,
  CreateAIProviderRequest,
  GoogleProviderAuthConfig,
  GoogleProviderConfig,
  isNil,
  OpenAICompatibleProviderAuthConfig,
  OpenAICompatibleProviderConfig,
  OpenAIProviderAuthConfig,
  OpenAIProviderConfig,
  UpdateAIProviderRequest,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { createMemo, createSignal, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import {
  aiProviderApi,
  hasAnyAuthFieldFilled,
} from '@/features/platform-admin';

import { ApMarkdown } from '../../../../../../components/custom/markdown';

import { UpsertProviderConfigForm } from './upsert-provider-config-form';

type UpsertAIProviderDialogProps = {
  provider: AIProviderName;
  providerId?: string;
  config?: AIProviderConfig;
  children: JSX.Element;
  onSave: () => void;
  defaultDisplayName?: string;
};

export type ProviderForm = {
  provider: AIProviderName;
  displayName: string;
  config: AIProviderConfig;
  auth: AIProviderAuthConfig;
};

export const UpsertAIProviderDialog = (params: UpsertAIProviderDialogProps) => {
  const [open, setOpen] = createSignal(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
      }}
    >
      <UpsertAIProviderDialogContent
        key={open ? 'opened' : 'closed'}
        {...params}
        setOpen={setOpen}
      />
    </Dialog>
  );
};

export const UpsertAIProviderDialogContent = ({
  children,
  onSave,
  config,
  provider,
  providerId,
  defaultDisplayName = '',
  setOpen,
}: UpsertAIProviderDialogProps & { setOpen: (val: boolean) => void }) => {
  const currentProviderDef = createMemo(
    () => SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider)!
  );
  const [form, setForm] = createStore<ProviderForm>({
    provider,
    displayName: defaultDisplayName,
    config: config ?? getDefaultConfig(provider),
    auth: getDefaultAuth(provider),
  });
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [serverError, setServerError] = createSignal<string>();

  const { mutate, isPending } = createMutation({
    mutationFn: (data: CreateAIProviderRequest): Promise<void> => {
      if (providerId) {
        const updateData: UpdateAIProviderRequest = {
          displayName: data.displayName,
          config: data.config,
          ...(hasAnyAuthFieldFilled(data.auth) ? { auth: data.auth } : {}),
        };
        return aiProviderApi.update(providerId, updateData);
      } else {
        return aiProviderApi.upsert(data);
      }
    },
    onSuccess: () => {
      setOpen(false);
      onSave();
    },
    onError: (
      error: AxiosError<{ message?: string; params?: { message: string } }>
    ) => {
      const data = error.response?.data;

      setServerError(
        data?.message ?? data?.params?.message ?? JSON.stringify(error)
      );
    },
  });

  const handleSave = (e: SubmitEvent) => {
    e.preventDefault();
    setServerError(undefined);
    const parsed = createFormSchema(provider, !isNil(providerId)).safeParse(
      form
    );
    const errs = getVertexErrors(form);
    if (!parsed.success) {
      setErrors({ ...getZodErrors(parsed.error), ...errs });
      return;
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    mutate(parsed.data);
  };

  return (
    <>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <Show when={providerId} fallback={t('Add AI Provider')}>
              t('Update AI Provider'
            </Show>
          </DialogTitle>
        </DialogHeader>

        <form className="grid space-y-4" onSubmit={handleSave}>
          <ScrollArea viewPortClassName="max-h-[calc(70vh)] p-px">
            <div className="space-y-4">
              <div
                class="space-y-3"
                hidden={currentProviderDef().provider !== AIProviderName.CUSTOM}
              >
                <Label for="displayName">{t('Display Name')}</Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onInput={(e) => setForm('displayName', e.currentTarget.value)}
                  placeholder={'My Provider'}
                  disabled={isPending}
                />
                <FieldError message={errors().displayName} />
              </div>

              <Show when={currentProviderDef().markdown}>
                <div className="text-sm text-muted-foreground">
                  <ApMarkdown
                    markdown={currentProviderDef().markdown}
                  ></ApMarkdown>
                </div>
              </Show>

              <UpsertProviderConfigForm
                form={{ values: form, set: setForm, errors: errors() }}
                provider={provider}
                apiKeyRequired={!config}
                isLoading={isPending}
                isEditMode={!!providerId}
              />

              <FieldError message={serverError()} />
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant={'outline'}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setOpen(false);
              }}
              disabled={isPending}
            >
              {t('Cancel')}
            </Button>
            <Button disabled={isPending} loading={isPending} type="submit">
              {t('Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </>
  );
};

const FieldError = ({ message }: { message?: string }) => (
  <Show when={message}>
    <p class="text-sm font-medium text-destructive wrap-break-word">
      {t(message ?? '')}
    </p>
  </Show>
);

const getZodErrors = (err: z.ZodError) =>
  Object.fromEntries(
    err.issues.map((issue) => [issue.path.join('.'), issue.message])
  );

const getVertexErrors = (form: ProviderForm) => {
  if (form.provider !== AIProviderName.CLOUDFLARE_GATEWAY) {
    return {};
  }
  if (
    !form.config.models.some((model) =>
      model.modelId.includes('google-vertex-ai')
    )
  ) {
    return {};
  }
  return {
    ...(form.config.vertexProject?.trim()
      ? {}
      : {
          'config.vertexProject': 'Required when using Google Vertex AI models',
        }),
    ...(form.config.vertexRegion?.trim()
      ? {}
      : {
          'config.vertexRegion': 'Required when using Google Vertex AI models',
        }),
  };
};

const getDefaultAuth = (provider: AIProviderName): AIProviderAuthConfig => {
  if (provider === AIProviderName.BEDROCK) {
    return { accessKeyId: '', secretAccessKey: '' };
  }
  return { apiKey: '' };
};

const getDefaultConfig = (provider: AIProviderName): AIProviderConfig => {
  if (provider === AIProviderName.AZURE) {
    return { resourceName: '', apiVersion: '' };
  }
  if (provider === AIProviderName.CLOUDFLARE_GATEWAY) {
    return { accountId: '', gatewayId: '', models: [] };
  }
  if (provider === AIProviderName.CUSTOM) {
    return {
      baseUrl: '',
      apiKeyHeader: 'Authorization',
      models: [],
      defaultHeaders: {},
    };
  }
  if (provider === AIProviderName.BEDROCK) {
    return { region: '' };
  }
  return {};
};

const OptionalAuthSchema = z
  .object({
    apiKey: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
  })
  .optional();

const createFormSchema = (provider: AIProviderName, editMode: boolean) => {
  if (provider === AIProviderName.AZURE) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.AZURE),
      config: AzureProviderConfig,
      auth: editMode ? OptionalAuthSchema : AzureProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.CLOUDFLARE_GATEWAY) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.CLOUDFLARE_GATEWAY),
      config: CloudflareGatewayProviderConfig,
      auth: editMode ? OptionalAuthSchema : CloudflareGatewayProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.CUSTOM) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.CUSTOM),
      config: OpenAICompatibleProviderConfig,
      auth: editMode ? OptionalAuthSchema : OpenAICompatibleProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.BEDROCK) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.BEDROCK),
      config: BedrockProviderConfig,
      auth: editMode ? OptionalAuthSchema : BedrockProviderAuthConfig,
    });
  }
  const authSchema = z.union([
    AnthropicProviderAuthConfig,
    GoogleProviderAuthConfig,
    OpenAIProviderAuthConfig,
  ]);
  return z.object({
    displayName: z.string().min(1),
    provider: z.literal(provider),
    auth: editMode ? OptionalAuthSchema : authSchema,
    config: z.union([
      AnthropicProviderConfig,
      GoogleProviderConfig,
      OpenAIProviderConfig,
    ]),
  });
};
