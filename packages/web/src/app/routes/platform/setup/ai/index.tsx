import {
  AIProviderName,
  AIProviderWithoutSensitiveData,
  PlatformRole,
} from '@activepieces/shared';
import { t } from 'i18next';
import { MessageSquare } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { CenteredPage } from '@/app/components/centered-page';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_AI_PROVIDERS, AiProviderInfo } from '@/features/agents';
import {
  aiProviderQueries,
  aiProviderMutations,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { AIProviderCard } from './universal-pieces/ai-provider-card';

const ACTIVEPIECES_LOGO_URL =
  'https://cdn.activepieces.com/pieces/activepieces.png';

export default function AIProvidersPage() {
  const { data: providers, refetch } = aiProviderQueries.useAiProviders();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { platform } = platformHooks.useCurrentPlatform();
  const allowWrite = platform.plan.aiProvidersEnabled;

  const { mutate: deleteProvider } = aiProviderMutations.useDeleteAiProvider({
    onSuccess: () => {
      void refetch();
    },
  });

  const { mutate: toggleChatProvider } =
    aiProviderMutations.useToggleChatProvider({
      onSuccess: () => {
        void refetch();
      },
    });

  const configuredProviders = providers ?? [];
  const chatProvider = providers?.find((p) => p.enabledForChat);
  const desc = String(
    allowWrite
      ? t(
          'Set provider credentials that will be used by universal AI pieces, i.e Text AI.',
        )
      : t(
          'Available AI providers that will be used by universal AI pieces, i.e Text AI.',
        ),
  );

  return (
    <LockedFeatureGuard
      featureKey="UNIVERSAL_AI"
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={t('Unlock AI')}
      lockDescription={t(
        'Set your AI providers so your users enjoy a seamless building experience with our universal AI pieces',
      )}
    >
      <CenteredPage title={t('AI Providers')} description={desc}>
        <Show when={allowWrite && configuredProviders.length > 0}>
          <ChatProviderSelector
            providers={configuredProviders}
            providerInfos={SUPPORTED_AI_PROVIDERS}
            selectedProviderId={chatProvider?.id ?? null}
            onSelect={(providerId, displayName) =>
              toggleChatProvider({ providerId, displayName })
            }
          />
        </Show>

        <div class="flex flex-col gap-4">
          <For each={SUPPORTED_AI_PROVIDERS}>
            {(providerDef) => {
              const config = providers?.find(
                (p) => p.provider === providerDef.provider,
              );

              return (
                <AIProviderCard
                  key={providerDef.provider}
                  providerInfo={providerDef}
                  providerConfig={config}
                  onDelete={(id) => deleteProvider(id)}
                  onSave={() => {
                    void refetch();
                  }}
                  allowWrite={allowWrite}
                />
              );
            }}
          </For>
        </div>
      </CenteredPage>
    </LockedFeatureGuard>
  );
}

function ChatProviderSelector(props: {
  providers: AIProviderWithoutSensitiveData[];
  providerInfos: AiProviderInfo[];
  selectedProviderId: string | null;
  onSelect: (providerId: string, displayName: string) => void;
}) {
  const getLogoUrl = (providerName: AIProviderName) =>
    props.providerInfos.find((p) => p.provider === providerName)?.logoUrl ??
    (providerName === AIProviderName.ACTIVEPIECES
      ? ACTIVEPIECES_LOGO_URL
      : undefined);

  return (
    <div class="flex items-center gap-3 rounded-lg border bg-card p-4 mb-6">
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
        <MessageSquare class="size-4 text-muted-foreground" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium leading-none">{t('Chat Provider')}</p>
        <p class="text-xs text-muted-foreground mt-1">
          {t('Select which AI provider powers the chat feature')}
        </p>
      </div>
      <Select
        value={props.selectedProviderId ?? undefined}
        onValueChange={(value) => {
          const provider = props.providers.find((p) => p.id === value);
          if (provider) props.onSelect(provider.id, provider.name);
        }}
      >
        <SelectTrigger class="w-52">
          <SelectValue placeholder={String(t('Select provider'))} />
        </SelectTrigger>
        <SelectContent>
          <For each={props.providers}>
            {(provider) => {
              const logoUrl = getLogoUrl(provider.provider);
              return (
                <SelectItem key={provider.id} value={provider.id}>
                  <div class="flex items-center gap-2">
                    <Show when={logoUrl}>
                      <img
                        src={logoUrl}
                        alt={provider.provider}
                        class="size-4 object-contain"
                      />
                    </Show>
                    <span>{provider.name}</span>
                  </div>
                </SelectItem>
              );
            }}
          </For>
        </SelectContent>
      </Select>
    </div>
  );
}
