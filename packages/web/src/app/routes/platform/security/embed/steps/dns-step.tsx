import {
  EmbedSubdomain,
  EmbedSubdomainStatus,
  EmbedVerificationRecord,
  EmbedVerificationRecordPurpose,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CheckCircle, Loader2, XCircle } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Label } from '@/components/ui/label';

import { StepShell } from '../stepper';

export const DnsStep = (props: { subdomain: EmbedSubdomain | undefined }) => {
  return (
    <StepShell
      title={t('Verify the DNS records')}
      description={t(
        "Add these records at your DNS provider. We'll detect them automatically — this usually takes a few minutes.",
      )}
    >
      <Show when={props.subdomain}>
        <div class="flex flex-col gap-4">
          <EmbedStatusBadge status={props.subdomain?.status} />
          <Show
            when={
              props.subdomain?.status ===
              EmbedSubdomainStatus.PENDING_VERIFICATION
            }
          >
            <VerificationInstructions
              records={props.subdomain?.verificationRecords ?? []}
            />
          </Show>
        </div>
      </Show>
    </StepShell>
  );
};

const EmbedStatusBadge = (props: {
  status: EmbedSubdomainStatus | undefined;
}) => {
  switch (props.status) {
    case EmbedSubdomainStatus.ACTIVE:
      return (
        <div class="flex items-center gap-2 text-sm text-success-600">
          <CheckCircle class="size-4" />
          {t('DNS verified — your domain is ready')}
        </div>
      );
    case EmbedSubdomainStatus.PENDING_VERIFICATION:
      return (
        <div class="flex items-center gap-2 text-sm text-warning">
          <Loader2 class="size-4 animate-spin" />
          {t('Waiting for DNS')}
        </div>
      );
    case EmbedSubdomainStatus.FAILED:
      return (
        <div class="flex items-center gap-2 text-sm text-destructive">
          <XCircle class="size-4" />
          {t('Verification failed. Contact support to retry.')}
        </div>
      );
  }
};

const VerificationInstructions = (props: {
  records: EmbedVerificationRecord[];
}) => {
  return (
    <div class="flex flex-col gap-6 rounded-md border p-4">
      <For each={props.records}>
        {(record, index) => (
          <VerificationRow
            key={`${record.type}-${record.name}-${index()}`}
            record={record}
          />
        )}
      </For>
    </div>
  );
};

const VerificationRow = (props: { record: EmbedVerificationRecord }) => {
  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">
          {props.record.type}
        </span>
        <span class="text-xs text-muted-foreground">
          {t(PURPOSE_LABELS[props.record.purpose])}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5 min-w-0">
          <Label class="text-xs text-muted-foreground">{t('Name')}</Label>
          <CopyToClipboardInput
            textToCopy={props.record.name}
            useInput={true}
          />
        </div>
        <div class="flex flex-col gap-1.5 min-w-0">
          <Label class="text-xs text-muted-foreground">{t('Value')}</Label>
          <CopyToClipboardInput
            textToCopy={props.record.value}
            useInput={true}
          />
        </div>
      </div>
    </div>
  );
};

const PURPOSE_LABELS: Record<EmbedVerificationRecordPurpose, string> = {
  [EmbedVerificationRecordPurpose.HOSTNAME]: 'embedPurposeHostname',
  [EmbedVerificationRecordPurpose.OWNERSHIP]: 'embedPurposeOwnership',
  [EmbedVerificationRecordPurpose.SSL]: 'embedPurposeSsl',
};
