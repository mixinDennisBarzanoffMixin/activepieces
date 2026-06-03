import {
  ApErrorParams,
  ApFlagId,
  PlatformWithoutSensitiveData,
  SsoDomainVerification,
  SsoDomainVerificationRecord,
  SsoDomainVerificationStatus,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { CheckCircle, Loader2, TriangleAlert } from 'lucide-solid';
import { createMemo, createSignal, Show, untrack } from 'solid-js';
import { toast } from 'solid-sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { ApMarkdown } from '@/components/custom/markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Textarea } from '@/components/ui/textarea';
import { samlSsoApi } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export const ConfigureSamlDialog = (props: ConfigureSamlDialogProps) => {
  const [open, setOpen] = createSignal(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="basic" onClick={() => setOpen(true)}>
          {props.connected ? t('Edit') : t('Enable')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Show when={open()}>
          <SamlWizard
            key={open() ? 'open' : 'closed'}
            platform={props.platform}
            connected={props.connected}
            refetch={props.refetch}
            onClose={() => setOpen(false)}
          />
        </Show>
      </DialogContent>
    </Dialog>
  );
};

const SamlWizard = (props: {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  refetch: () => Promise<void>;
  onClose: () => void;
}) => {
  const verified = createMemo(
    () =>
      props.platform.ssoDomainVerification?.status ===
      SsoDomainVerificationStatus.VERIFIED,
  );
  const [step, setStep] = createSignal<WizardStep>(
    untrack(() => (props.connected || !verified() ? 'domain' : 'saml')),
  );

  const { mutate: disableSaml, isPending: isDisabling } = createMutation(
    () => ({
      mutationFn: async () => {
        await platformApi.update(
          { federatedAuthProviders: { saml: null } },
          props.platform.id,
        );
        await props.refetch();
      },
      onSuccess: () => {
        toast.success(t('Single sign-on settings updated'), { duration: 3000 });
        props.onClose();
      },
    }),
  );

  const action = createMemo(() =>
    props.connected ? { onDisable: () => disableSaml(), isDisabling } : null,
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Configure SAML 2.0 SSO')}</DialogTitle>
      </DialogHeader>
      <StepIndicator step={step} />
      <div class={cn(step !== 'domain' && 'hidden')}>
        <DomainStep
          platform={props.platform}
          refetch={props.refetch}
          onVerified={() => setStep('saml')}
          onNext={() => setStep('saml')}
          canProceed={verified()}
          disableAction={action()}
        />
      </div>
      <div class={cn(step !== 'saml' && 'hidden')}>
        <SamlStep
          platform={props.platform}
          refetch={props.refetch}
          onBack={() => setStep('domain')}
          onClose={props.onClose}
          disableAction={action()}
        />
      </div>
    </>
  );
};

const StepIndicator = (props: { step: WizardStep }) => (
  <div class="flex items-center gap-3 text-xs text-muted-foreground">
    <div
      class={cn(
        'flex items-center gap-2',
        props.step === 'domain' && 'text-foreground font-medium',
      )}
    >
      <span
        class={cn(
          'flex size-5 items-center justify-center rounded-full border text-xs',
          props.step === 'domain'
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/40',
        )}
      >
        1
      </span>
      {t('SSO Domain')}
    </div>
    <div class="h-px w-6 bg-muted-foreground/30" />
    <div
      class={cn(
        'flex items-center gap-2',
        props.step === 'saml' && 'text-foreground font-medium',
      )}
    >
      <span
        class={cn(
          'flex size-5 items-center justify-center rounded-full border text-xs',
          props.step === 'saml'
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/40',
        )}
      >
        2
      </span>
      {t('SAML 2.0')}
    </div>
  </div>
);

const DomainStep = (props: {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  onVerified: () => void;
  onNext: () => void;
  canProceed: boolean;
  disableAction: DisableAction;
}) => {
  const [domain, setDomain] = createSignal(
    untrack(() => props.platform.ssoDomain ?? ''),
  );
  const [error, setError] = createSignal('');
  const verification = createMemo(
    () => props.platform.ssoDomainVerification ?? null,
  );
  const data = createMemo(() => ({ ssoDomain: domain() }));
  const valid = createMemo(() => SsoDomainFormValues.safeParse(data()).success);
  const isDirty = createMemo(
    () => domain().trim().toLowerCase() !== (props.platform.ssoDomain ?? ''),
  );
  const [showUpdateWarning, setShowUpdateWarning] = createSignal(false);

  const { mutate: saveDomain, isPending: isSaving } = createMutation(() => ({
    mutationFn: async (values: SsoDomainFormValues) => {
      await samlSsoApi.updateSsoDomain(values.ssoDomain.trim().toLowerCase());
      await props.refetch();
    },
    onSuccess: () => {
      toast.success(t('SSO domain saved'));
      setError('');
      setShowUpdateWarning(false);
    },
    onError: (error) => {
      setError(extractServerErrorMessage(error, t("Couldn't save domain")));
      setShowUpdateWarning(false);
    },
  }));

  const { mutate: verifyDomain, isPending: isVerifying } = createMutation(
    () => ({
      mutationFn: async () => {
        const result = await samlSsoApi.verifySsoDomain();
        await props.refetch();
        return result;
      },
      onSuccess: (result) => {
        if (
          result.ssoDomainVerification?.status ===
          SsoDomainVerificationStatus.VERIFIED
        ) {
          toast.success(t('Domain verified'));
          props.onVerified();
        } else {
          toast.message(
            t('TXT record not found yet — DNS can take a few minutes.'),
          );
        }
      },
      onError: (error) => {
        toast.error(
          extractServerErrorMessage(error, t("Couldn't verify domain")),
        );
      },
    }),
  );

  const handleSubmit = (values: SsoDomainFormValues) => {
    setError('');
    if (props.platform.ssoDomain) {
      setShowUpdateWarning(true);
      return;
    }
    saveDomain(values);
  };

  return (
    <>
      <form
        class="grid space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const result = SsoDomainFormValues.safeParse(data());
          if (!result.success) {
            setError(t('invalidSsoDomain'));
            return;
          }
          handleSubmit(result.data);
        }}
      >
        <div class="grid space-y-2">
          <Label for="ssoDomain">{t('Domain')}</Label>
          <Input
            id="ssoDomain"
            value={domain()}
            onInput={(e) => setDomain(e.currentTarget.value)}
            placeholder="acme.com"
            class="rounded-sm"
          />
          <p class="text-sm text-muted-foreground">
            {t(
              'When a user enters this domain on the sign-in page, they will be redirected to your SAML identity provider.',
            )}
          </p>
        </div>

        <Show when={verification() && !isDirty()}>
          <DomainVerificationPanel
            verification={verification()}
            isVerifying={isVerifying}
            onVerify={() => verifyDomain()}
          />
        </Show>

        <Show when={error()}>
          <p class="text-sm font-medium text-destructive wrap-break-word">
            {error()}
          </p>
        </Show>

        <DialogFooter>
          <Show when={props.disableAction}>
            <Button
              type="button"
              variant="basic"
              class="text-destructive"
              loading={props.disableAction.isDisabling}
              onClick={props.disableAction.onDisable}
            >
              {t('Disable')}
            </Button>
          </Show>
          <Show
            when={isDirty()}
            fallback={
              <Button
                type="button"
                onClick={props.onNext}
                disabled={!props.canProceed}
              >
                {t('Next')}
              </Button>
            }
          >
            <Button type="submit" loading={isSaving} disabled={!valid()}>
              {props.platform.ssoDomain ? t('Update domain') : t('Save domain')}
            </Button>
          </Show>
        </DialogFooter>
      </form>
      <Dialog open={showUpdateWarning} onOpenChange={setShowUpdateWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Update SSO domain?')}</DialogTitle>
          </DialogHeader>
          <Alert variant="warning">
            <TriangleAlert class="size-4" />
            <AlertDescription>
              {t(
                "Users won't be able to sign in via SSO until you verify the new domain.",
              )}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={isSaving}
              onClick={() => setShowUpdateWarning(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              loading={isSaving}
              onClick={() => saveDomain(data())}
            >
              {t('Update domain')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const SamlStep = (props: {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  onBack: () => void;
  onClose: () => void;
  disableAction: DisableAction;
}) => {
  const [values, setValues] = createSignal<Saml2FormValues>({
    idpMetadata: '',
    idpCertificate: '',
  });
  const [error, setError] = createSignal('');
  const valid = createMemo(() => Saml2FormValues.safeParse(values()).success);

  const { data: samlAcs } = flagsHooks.useFlag<string>(
    ApFlagId.SAML_AUTH_ACS_URL,
  );

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: async (request: UpdatePlatformRequestBody) => {
      await platformApi.update(request, props.platform.id);
      await props.refetch();
    },
    onSuccess: () => {
      toast.success(t('Single sign-on settings updated'), { duration: 3000 });
      setError('');
      props.onClose();
    },
    onError: (error) => {
      setError(
        extractServerErrorMessage(
          error,
          t("Couldn't save single sign-on settings"),
        ),
      );
    },
  }));

  return (
    <>
      <Show when={samlAcs}>
        <div class="mb-4">
          <ApMarkdown
            markdown={t(
              `
**Setup Instructions**:
Please check the following documentation: [SAML SSO](https://activepieces.com/docs/security/sso)

**Single sign-on URL**:
\`\`\`text
{samlAcs}
\`\`\`
**Audience URI (SP Entity ID)**:
\`\`\`text
Activepieces
\`\`\`
`,
              { samlAcs: samlAcs ?? '' },
            )}
          />
        </div>
      </Show>

      <form
        class="grid space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const result = Saml2FormValues.safeParse(values());
          if (!result.success) {
            setError(t('Please fill all required fields'));
            return;
          }
          mutate({ federatedAuthProviders: { saml: result.data } });
        }}
      >
        <div class="grid space-y-2">
          <Label for="idpMetadata">{t('IDP Metadata')}</Label>
          <Textarea
            required
            id="idpMetadata"
            value={values().idpMetadata}
            onInput={(e) =>
              setValues((values) => ({
                ...values,
                idpMetadata: e.currentTarget.value,
              }))
            }
            rows={6}
            class="rounded-sm font-mono text-xs"
          />
          <p class="text-sm text-muted-foreground">
            {t(
              'Paste the metadata XML contents or the metadata URL provided by your identity provider.',
            )}
          </p>
        </div>
        <div class="grid space-y-4">
          <Label for="idpCertificate">{t('IDP Certificate')}</Label>
          <Textarea
            required
            id="idpCertificate"
            value={values().idpCertificate}
            onInput={(e) =>
              setValues((values) => ({
                ...values,
                idpCertificate: e.currentTarget.value,
              }))
            }
            class="rounded-sm"
          />
        </div>
        <Show when={error()}>
          <p class="text-sm font-medium text-destructive wrap-break-word">
            {error()}
          </p>
        </Show>

        <DialogFooter>
          <Show when={props.disableAction}>
            <Button
              type="button"
              variant="basic"
              class="text-destructive mr-auto"
              loading={props.disableAction.isDisabling}
              onClick={props.disableAction.onDisable}
            >
              {t('Disable')}
            </Button>
          </Show>
          <Button variant="outline" type="button" onClick={props.onBack}>
            {t('Back')}
          </Button>
          <Button loading={isPending} disabled={!valid()} type="submit">
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

const DomainVerificationPanel = (props: {
  verification: SsoDomainVerification;
  isVerifying: boolean;
  onVerify: () => void;
}) => {
  const verified = createMemo(
    () => props.verification.status === SsoDomainVerificationStatus.VERIFIED,
  );
  return (
    <div class="flex flex-col gap-3">
      <VerificationStatusBadge status={props.verification.status} />
      <Show when={!verified()}>
        <>
          <p class="text-xs text-muted-foreground">
            {t(
              "Add this TXT record at your DNS provider. We'll detect it once it propagates — this usually takes a few minutes.",
            )}
          </p>
          <VerificationRecordRow record={props.verification.record} />
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={props.isVerifying}
              onClick={props.onVerify}
            >
              {t('Verify DNS')}
            </Button>
          </div>
        </>
      </Show>
    </div>
  );
};

const VerificationStatusBadge = (props: {
  status: SsoDomainVerificationStatus;
}) => (
  <Show
    when={props.status === SsoDomainVerificationStatus.VERIFIED}
    fallback={
      <div class="flex items-center gap-2 text-sm text-warning">
        <Loader2 class="size-4 animate-spin" />
        {t('Waiting for DNS')}
      </div>
    }
  >
    <div class="flex items-center gap-2 text-sm text-success-600">
      <CheckCircle class="size-4" />
      {t('DNS verified — domain is ready')}
    </div>
  </Show>
);

const VerificationRecordRow = (props: {
  record: SsoDomainVerificationRecord;
}) => (
  <div class="flex flex-col gap-2 rounded-md border p-4">
    <div class="flex items-center gap-2">
      <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">
        {props.record.type}
      </span>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1.5 min-w-0">
        <Label class="text-xs text-muted-foreground">{t('Name')}</Label>
        <CopyToClipboardInput textToCopy={props.record.name} useInput={true} />
      </div>
      <div class="flex flex-col gap-1.5 min-w-0">
        <Label class="text-xs text-muted-foreground">{t('Value')}</Label>
        <CopyToClipboardInput textToCopy={props.record.value} useInput={true} />
      </div>
    </div>
  </div>
);

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

const SsoDomainFormValues = z.object({
  ssoDomain: z
    .hostname('invalidSsoDomain')
    .max(253, 'invalidSsoDomain')
    .refine((v) => v.includes('.'), 'invalidSsoDomain'),
});
type SsoDomainFormValues = z.infer<typeof SsoDomainFormValues>;

const Saml2FormValues = z.object({
  idpMetadata: z.string().min(1),
  idpCertificate: z.string().min(1),
});
type Saml2FormValues = z.infer<typeof Saml2FormValues>;

type WizardStep = 'domain' | 'saml';

type DisableAction = {
  onDisable: () => void;
  isDisabling: boolean;
} | null;

type ConfigureSamlDialogProps = {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  refetch: () => Promise<void>;
};
