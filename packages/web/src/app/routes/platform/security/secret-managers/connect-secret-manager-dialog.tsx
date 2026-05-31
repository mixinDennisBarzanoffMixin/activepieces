import { createMemo, createSignal, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import {
  ConnectSecretManagerRequest,
  ConnectSecretManagerRequestSchema,
  SECRET_MANAGER_PROVIDERS_METADATA,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
  SecretManagerProviderMetaData,
  ApErrorParams,
  ErrorCode,
  SecretManagerProviderConfig,
} from '@activepieces/shared';
import { t } from 'i18next';

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

const AddEditSecretManagerConnectionDialog = ({
  children,
  connection,
}: AddEditSecretManagerConnectionDialogProps) => {
  const [open, setOpen] = createSignal(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>{children}</DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('Edit')}</TooltipContent>
      </Tooltip>
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {connection
              ? `${t('Edit')} ${connection.name}`
              : t('New Secret Manager Connection')}
          </DialogTitle>
        </DialogHeader>
        <AddEditSecretManagerForm
          key={open ? 'open' : 'closed'}
          connection={connection}
          setOpen={setOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddEditSecretManagerConnectionDialog;

const AddEditSecretManagerForm = ({
  connection,
  setOpen,
}: {
  connection?: SecretManagerConnectionWithStatus;
  setOpen: (open: boolean) => void;
}) => {
  const isEdit = !!connection;
  const [form, setForm] = createStore(
    secretManagersUtils.getDefaultValues(connection)
  );
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [serverError, setServerError] = createSignal<string>();
  const selectedProvider = createMemo<
    SecretManagerProviderMetaData | undefined
  >(() =>
    SECRET_MANAGER_PROVIDERS_METADATA.find((p) => p.id === form.providerId)
  );

  const { mutate: createConnection, isPending: isCreating } =
    secretManagersHooks.useCreateSecretManagerConnection({
      onSuccess: () => setOpen(false),
      onError: (error) => handleMutationError(error, setServerError),
    });

  const { mutate: updateConnection, isPending: isUpdating } =
    secretManagersHooks.useUpdateSecretManagerConnection({
      onSuccess: () => setOpen(false),
      onError: (error) => handleMutationError(error, setServerError),
    });

  const isPending = isCreating || isUpdating;

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    setServerError(undefined);
    const parsed = ConnectSecretManagerRequestSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join('.'),
            issue.message,
          ])
        )
      );
      return;
    }
    setErrors({});
    if (isEdit && connection) {
      updateConnection({ id: connection.id, config: parsed.data });
    } else {
      createConnection(parsed.data);
    }
  };

  return (
    <form class="grid space-y-4" onSubmit={handleSubmit}>
      <ScrollArea class="max-h-[500px]">
        <div class="grid space-y-3">
          <Show when={!isEdit}>
            <div class="space-y-2">
              <Label for="provider-select" showRequiredIndicator>
                {t('Provider')}
              </Label>
              <Select
                value={form.providerId}
                onValueChange={(val) => {
                  const provider = SECRET_MANAGER_PROVIDERS_METADATA.find(
                    (p) => p.id === val
                  );
                  if (!provider) {
                    return;
                  }
                  setForm('providerId', provider.id);
                  setForm(
                    'config',
                    secretManagersUtils.getEmptySecretManagerConfig(provider.id)
                  );
                }}
              >
                <SelectTrigger id="provider-select">
                  <SelectValue placeholder={t('Select a provider')} />
                </SelectTrigger>
                <SelectContent>
                  <For each={SECRET_MANAGER_PROVIDERS_METADATA}>
                    {(provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
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
              value={form.name}
              onInput={(e) => setForm('name', e.currentTarget.value)}
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
              value={form.scope}
              onValueChange={(val) =>
                setForm('scope', val as SecretManagerConnectionScope)
              }
            >
              <SelectTrigger id="connection-scope">
                <SelectValue placeholder={t('Select scope')} />
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

          <Show when={form.scope === SecretManagerConnectionScope.PROJECT}>
            <ProjectSelector
              value={form.projectIds}
              onChange={(ids) => setForm('projectIds', ids)}
            />
          </Show>

          <Show when={selectedProvider()}>
            {Object.entries(selectedProvider()?.fields ?? {}).map(
              ([fieldId, field]) => (
                <div class="space-y-2" key={fieldId}>
                  <Label for={fieldId} showRequiredIndicator={!field.optional}>
                    {field.displayName}
                  </Label>
                  <div class="flex gap-2 items-center justify-center">
                    <Input
                      id={fieldId}
                      placeholder={field.placeholder}
                      class="rounded-sm"
                      type={field.type}
                      value={String(
                        form.config[
                          fieldId as keyof SecretManagerProviderConfig
                        ] ?? ''
                      )}
                      onInput={(e) =>
                        setForm('config', (cfg) => ({
                          ...cfg,
                          [fieldId]: e.currentTarget.value,
                        }))
                      }
                    />
                  </div>
                  <FieldError message={errors()[`config.${fieldId}`]} />
                </div>
              )
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
            setOpen(false);
          }}
        >
          {t('Cancel')}
        </Button>
        <Button loading={isPending} type="submit">
          {t('Save')}
        </Button>
      </DialogFooter>
    </form>
  );
};

function handleMutationError(
  error: Error,
  setServerError: (message: string) => void
): void {
  if (api.isError(error)) {
    const apError = error.response?.data as ApErrorParams;
    if (apError?.code === ErrorCode.SECRET_MANAGER_CONNECTION_FAILED) {
      setServerError(
        t('Failed to connect to secret manager with error: "{msg}"', {
          msg: apError.params?.message,
        })
      );
    }
  } else {
    setServerError(
      t('Failed to connect to secret manager, please check console')
    );
  }
}

const FieldError = ({ message }: { message?: string }) => (
  <Show when={message}>
    <p class="text-sm font-medium text-destructive wrap-break-word">
      {t(message ?? '')}
    </p>
  </Show>
);

type AddEditSecretManagerConnectionDialogProps = {
  connection?: SecretManagerConnectionWithStatus;
  children: JSX.Element;
};
