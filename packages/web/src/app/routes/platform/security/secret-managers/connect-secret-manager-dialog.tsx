import {
  ConnectSecretManagerRequestSchema,
  SECRET_MANAGER_PROVIDERS_METADATA,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
  SecretManagerProviderMetaData,
  ApErrorParams,
  ErrorCode,
  SecretManagerProviderConfig,
  ConnectSecretManagerRequest,
} from '@activepieces/shared';
import { t } from 'i18next';
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js';

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
import { ProjectSelector } from '@/features/connections';
import { secretManagersHooks } from '@/features/secret-managers';
import { api } from '@/lib/api';

import { secretManagersUtils } from './util';

const AddEditSecretManagerConnectionDialog = (
  props: AddEditSecretManagerConnectionDialogProps,
) => {
  const [open, setOpen] = createSignal(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>{props.children}</DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('Edit')}</TooltipContent>
      </Tooltip>
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {props.connection
              ? `${t('Edit')} ${props.connection.name}`
              : t('New Secret Manager Connection')}
          </DialogTitle>
        </DialogHeader>
        <Show when={open()}>
          <AddEditSecretManagerForm
            connection={props.connection}
            setOpen={setOpen}
          />
        </Show>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditSecretManagerConnectionDialog;

const AddEditSecretManagerForm = (props: {
  connection?: SecretManagerConnectionWithStatus;
  setOpen: (open: boolean) => void;
}) => {
  const [form, setForm] = createSignal(
    secretManagersUtils.getDefaultValues(undefined),
  );
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [serverError, setServerError] = createSignal<string>();
  const selectedProvider = createMemo<
    SecretManagerProviderMetaData | undefined
  >(() =>
    SECRET_MANAGER_PROVIDERS_METADATA.find((p) => p.id === form().providerId),
  );

  createEffect(() => {
    setForm(secretManagersUtils.getDefaultValues(props.connection));
  });

  const { mutate: createConnection, isPending: isCreating } =
    secretManagersHooks.useCreateSecretManagerConnection({
      onSuccess: () => props.setOpen(false),
      onError: (error) => handleMutationError(error, setServerError),
    });

  const { mutate: updateConnection, isPending: isUpdating } =
    secretManagersHooks.useUpdateSecretManagerConnection({
      onSuccess: () => props.setOpen(false),
      onError: (error) => handleMutationError(error, setServerError),
    });

  const isPending = () => isCreating || isUpdating;

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    setServerError(undefined);
    const parsed = ConnectSecretManagerRequestSchema.safeParse(form());
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join('.'),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setErrors({});
    if (props.connection) {
      updateConnection({ id: props.connection.id, config: parsed.data });
      return;
    }
    createConnection(parsed.data);
  };

  return (
    <form class="grid space-y-4" onSubmit={handleSubmit}>
      <ScrollArea class="max-h-[500px]">
        <div class="grid space-y-3">
          <Show when={!props.connection}>
            <div class="space-y-2">
              <Label for="provider-select" showRequiredIndicator>
                {t('Provider')}
              </Label>
              <Select
                value={form().providerId}
                onValueChange={(val) => {
                  const provider = SECRET_MANAGER_PROVIDERS_METADATA.find(
                    (p) => p.id === val,
                  );
                  if (!provider) {
                    return;
                  }
                  setForm((data) => ({
                    ...data,
                    providerId: provider.id,
                    config: secretManagersUtils.getEmptySecretManagerConfig(
                      provider.id,
                    ),
                  }));
                }}
              >
                <SelectTrigger id="provider-select">
                  <SelectValue placeholder={String(t('Select a provider'))} />
                </SelectTrigger>
                <SelectContent>
                  <For each={SECRET_MANAGER_PROVIDERS_METADATA}>
                    {(provider) => (
                      <SelectItem value={provider.id}>
                        <div class="flex items-center gap-2">
                          <img
                            src={provider.logo}
                            alt={provider.name}
                            class="w-4 h-4 object-contain"
                          />
                          <span>{provider.name}</span>
                        </div>
                      </SelectItem>
                    )}
                  </For>
                </SelectContent>
              </Select>
              <FieldError message={errors().providerId} />
            </div>
          </Show>

          <div class="space-y-2">
            <Label for="connection-name" showRequiredIndicator>
              {t('Name')}
            </Label>
            <Input
              id="connection-name"
              value={form().name}
              onInput={(e) =>
                setForm((data) => ({ ...data, name: e.currentTarget.value }))
              }
              placeholder={t('e.g. Production HashiCorp')}
              class="rounded-sm"
            />
            <FieldError message={errors().name} />
          </div>

          <div class="space-y-2">
            <Label for="connection-scope" showRequiredIndicator>
              {t('Scope')}
            </Label>
            <Select
              value={form().scope}
              onValueChange={(val) => {
                if (val === SecretManagerConnectionScope.PLATFORM) {
                  setForm((data) => ({
                    ...data,
                    scope: SecretManagerConnectionScope.PLATFORM,
                  }));
                  return;
                }
                if (val === SecretManagerConnectionScope.PROJECT) {
                  setForm((data) => ({
                    ...data,
                    scope: SecretManagerConnectionScope.PROJECT,
                  }));
                }
              }}
            >
              <SelectTrigger id="connection-scope">
                <SelectValue placeholder={String(t('Select scope'))} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SecretManagerConnectionScope.PLATFORM}>
                  {t('Platform')}
                </SelectItem>
                <SelectItem value={SecretManagerConnectionScope.PROJECT}>
                  {t('Project')}
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={errors().scope} />
          </div>

          <Show when={form().scope === SecretManagerConnectionScope.PROJECT}>
            <ProjectSelector
              value={form().projectIds}
              onInput={(ids) =>
                setForm((data) => ({ ...data, projectIds: ids }))
              }
            />
          </Show>

          <Show when={selectedProvider()}>
            {(provider) => (
              <For each={Object.entries(provider().fields)}>
                {([fieldId, field]) => (
                  <div class="space-y-2">
                    <Label
                      for={fieldId}
                      showRequiredIndicator={!field.optional}
                    >
                      {field.displayName}
                    </Label>
                    <div class="flex gap-2 items-center justify-center">
                      <Input
                        id={fieldId}
                        placeholder={field.placeholder}
                        class="rounded-sm"
                        type={field.type}
                        value={String(
                          form().config[
                            fieldId as keyof SecretManagerProviderConfig
                          ],
                        )}
                        onInput={(e) =>
                          setForm((data) =>
                            updateConfig(data, fieldId, e.currentTarget.value),
                          )
                        }
                      />
                    </div>
                    <FieldError message={errors()[`config.${fieldId}`]} />
                  </div>
                )}
              </For>
            )}
          </Show>
        </div>
      </ScrollArea>
      <FieldError message={serverError()} />

      <DialogFooter class="mt-1">
        <Button
          variant="outline"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.setOpen(false);
          }}
        >
          {t('Cancel')}
        </Button>
        <Button loading={isPending()} type="submit">
          {t('Save')}
        </Button>
      </DialogFooter>
    </form>
  );
};

function updateConfig(
  data: ConnectSecretManagerRequest,
  key: string,
  value: string,
): ConnectSecretManagerRequest {
  return {
    ...data,
    config: {
      ...data.config,
      [key]: value,
    },
  };
}

function handleMutationError(
  error: Error,
  setServerError: (message: string) => void,
): void {
  if (api.isError(error)) {
    const apError = error.response?.data as ApErrorParams;
    if (apError.code === ErrorCode.SECRET_MANAGER_CONNECTION_FAILED) {
      setServerError(
        t('Failed to connect to secret manager with error: "{msg}"', {
          msg: apError.params.message,
        }),
      );
    }
  } else {
    setServerError(
      t('Failed to connect to secret manager, please check console'),
    );
  }
}

const FieldError = (props: { message?: string }) => (
  <Show when={props.message}>
    {(msg) => (
      <p class="text-sm font-medium text-destructive wrap-break-word">
        {t(msg())}
      </p>
    )}
  </Show>
);

type AddEditSecretManagerConnectionDialogProps = {
  connection?: SecretManagerConnectionWithStatus;
  children: JSX.Element;
};
