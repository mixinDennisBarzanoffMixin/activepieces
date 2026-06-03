import {
  ApErrorParams,
  EmbedSubdomain,
  GenerateEmbedSubdomainRequest,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2 } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { embedSubdomainMutations } from '@/features/platform-admin';
import { api } from '@/lib/api';

import { StepShell } from '../stepper';

export const HostnameStep = (props: {
  subdomain: EmbedSubdomain | undefined;
}) => {
  return (
    <StepShell
      title={t('Enter the embed URL')}
      description={t(
        "Pick the domain you'll embed in your website. It will be visible inside workflows.",
      )}
    >
      <Show when={props.subdomain} fallback={<EmbedHostnameForm />}>
        {(subdomain) => <EmbedHostnameSummary subdomain={subdomain()} />}
      </Show>
    </StepShell>
  );
};

const EmbedHostnameForm = () => {
  const { mutate, isPending } = embedSubdomainMutations.useUpsert();
  const [hostname, setHostname] = createSignal('');
  const [error, setError] = createSignal('');

  const handleSubmit = (values: GenerateEmbedSubdomainRequest) => {
    mutate(values, {
      onSuccess: () => {
        toast.success(t('Domain saved'));
      },
      onError: (error) => {
        setError(extractServerErrorMessage(error, t("Couldn't save domain")));
      },
    });
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    setError('');
    const parsed = GenerateEmbedSubdomainRequest.safeParse({
      hostname: hostname(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || t("Couldn't save domain"));
      return;
    }
    handleSubmit(parsed.data);
  };

  return (
    <form onSubmit={submit} class="flex flex-col gap-3">
      <div class="space-y-1">
        <Label for="hostname">{t('Domain')}</Label>
        <Input
          id="hostname"
          value={hostname()}
          onInput={(event) => setHostname(event.currentTarget.value)}
          placeholder="flows.acme.com"
        />
        <p class="text-xs text-muted-foreground">
          {t('Use a subdomain you control, like flows.acme.com')}
        </p>
      </div>
      <Show when={error()}>
        <p class="text-sm text-destructive">{error()}</p>
      </Show>
      <div class="flex justify-end mt-6">
        <Button type="submit" size="sm" disabled={isPending}>
          <Show when={isPending}>
            <Loader2 class="size-4 animate-spin mr-2" />
          </Show>
          {t('Save domain')}
        </Button>
      </div>
    </form>
  );
};

const EmbedHostnameSummary = (props: { subdomain: EmbedSubdomain }) => {
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const { mutateAsync, isPending } = embedSubdomainMutations.useUpsert();
  const [hostname, setHostname] = createSignal(props.subdomain.hostname);
  const isDirty = () => hostname().trim() !== props.subdomain.hostname;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await mutateAsync({ hostname: hostname().trim() });
      toast.success(t('Domain updated'));
    } catch (error) {
      setErrorMessage(
        extractServerErrorMessage(error, t("Couldn't update domain")),
      );
      throw error;
    }
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    const parsed = GenerateEmbedSubdomainRequest.safeParse({
      hostname: hostname(),
    });
    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message || t("Couldn't update domain"),
      );
      return;
    }
    setHostname(parsed.data.hostname);
    setConfirmOpen(true);
  };

  return (
    <form onSubmit={submit} class="flex flex-col gap-3">
      <div class="space-y-1">
        <Label for="hostname">{t('Domain')}</Label>
        <Input
          id="hostname"
          value={hostname()}
          onInput={(event) => setHostname(event.currentTarget.value)}
          placeholder="flows.acme.com"
        />
        <p class="text-xs text-muted-foreground">
          {t('Use a subdomain you control, like flows.acme.com')}
        </p>
      </div>
      <Show when={errorMessage()}>
        <p class="text-sm text-destructive">{errorMessage()}</p>
      </Show>
      <div class="flex justify-end mt-6">
        <Button type="submit" size="sm" disabled={!isDirty() || isPending}>
          <Show when={isPending}>
            <Loader2 class="size-4 animate-spin mr-2" />
          </Show>
          {t('Update')}
        </Button>
      </div>
      <ConfirmationDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('Change embed domain?')}
        message={String(
          t(
            "Your current domain will stop working and you'll need to add new DNS records to verify the new one. Allowed websites and signing keys will be kept.",
          ),
        )}
        warning={String(t('This action cannot be undone.'))}
        buttonText={t('Update domain')}
        entityName={t('domain')}
        mutationFn={handleConfirm}
      />
    </form>
  );
};

function extractServerErrorMessage(error: unknown, fallback: string): string {
  if (api.isError(error)) {
    const data = error.response?.data as ApErrorParams | undefined;
    const message =
      data?.params && 'message' in data.params
        ? data.params.message
        : undefined;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return fallback;
}
