import {
  OAuth2Property,
  OAuth2Props,
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  ApFlagId,
  AppConnectionType,
  OAuth2GrantType,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-solid';
import { createSignal, For, Show } from 'solid-js';

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/custom/multi-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import {
  oauth2Utils,
  type OAuth2App,
} from '@/features/connections/utils/oauth2-utils';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { SolidConnectionForm } from './connection-form';
import { SecretInput } from './secret-input';

function OAuth2ConnectionSettings(props: OAuth2ConnectionSettingsProps) {
  const isClientIdValid = () =>
    isNil(props.form.errors()['request.value.client_id']);
  const isClientSecretValid = () =>
    props.oauth2App.oauth2Type !== AppConnectionType.OAUTH2 ||
    String(props.form.getValue('request.value.client_secret') ?? '').length > 0;
  const isPropsValid = () => isNil(props.form.errors()['request.value.props']);
  const selectedScopeString = () =>
    String(props.form.getValue('request.value.scope') ?? '');
  const showScopeSelector = props.authProperty.scope.length > 1;
  const hasSelectedScopes = () =>
    !showScopeSelector || selectedScopeString().trim().length > 0;
  const isConnectButtonEnabled = () =>
    isClientIdValid() &&
    isClientSecretValid() &&
    isPropsValid() &&
    hasSelectedScopes();
  const { data: thirdPartyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
  );
  const redirectUrl =
    props.oauth2App.oauth2Type === AppConnectionType.CLOUD_OAUTH2
      ? 'https://secrets.activepieces.com/redirect'
      : thirdPartyUrl ?? 'no_redirect_url_found';

  const showRedirectUrlInput =
    props.oauth2App.oauth2Type === AppConnectionType.OAUTH2 &&
    props.grantType === OAuth2GrantType.AUTHORIZATION_CODE;
  const [loading, setLoading] = createSignal(false);
  const [scopesEditing, setScopesEditing] = createSignal(false);

  return (
    <div class="flex flex-col gap-4">
      <Show when={showRedirectUrlInput}>
        <div class="flex flex-col gap-2">
          <Label>{t('Redirect URL')}</Label>
          <Input disabled type="text" value={redirectUrl} />
        </div>
      </Show>

      <Show when={props.oauth2App.oauth2Type === AppConnectionType.OAUTH2}>
        <>
          <div class="flex flex-col gap-2">
            <Label class="flex items-center gap-1" showRequiredIndicator>
              <span>{t('Client ID')}</span>
            </Label>
            <SecretInput
              value={String(
                props.form.getValue('request.value.client_id') ?? '',
              )}
              onInput={(value) =>
                props.form.setValue('request.value.client_id', value)
              }
              type="text"
            />
          </div>
          <div class="flex flex-col gap-2">
            <Label class="flex items-center gap-1" showRequiredIndicator>
              <span>{t('Client Secret')}</span>
            </Label>
            <SecretInput
              value={String(
                props.form.getValue('request.value.client_secret') ?? '',
              )}
              onInput={(value) =>
                props.form.setValue('request.value.client_secret', value)
              }
              type="password"
            />
          </div>
        </>
      </Show>

      <Show when={showScopeSelector}>
        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-2">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setScopesEditing((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setScopesEditing((v) => !v);
                }
              }}
              class="flex w-full items-center gap-2 text-sm font-medium cursor-pointer select-none"
            >
              <span class="leading-none">{t('Permissions')}</span>
              <ChevronDown
                class={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                  !scopesEditing() && '-rotate-90',
                )}
              />
            </div>
            <Show when={scopesEditing()}>
              <MultiSelect
                modal={true}
                value={parseScopeString(selectedScopeString())}
                onValueChange={(next: string[]) =>
                  props.form.setValue('request.value.scope', next.join(' '))
                }
                items={props.authProperty.scope.map((scope) => ({
                  value: scope,
                  label: scope,
                }))}
              >
                <MultiSelectTrigger>
                  <Show
                    when={parseScopeString(selectedScopeString()).length < 10}
                    fallback={t('{number} items selected', {
                      number: parseScopeString(selectedScopeString()).length,
                    })}
                  >
                    <MultiSelectValue placeholder={t('Select permissions')} />
                  </Show>
                </MultiSelectTrigger>
                <MultiSelectContent>
                  <MultiSelectSearch placeholder={t('Search permissions')} />
                  <MultiSelectList>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        props.form.setValue(
                          'request.value.scope',
                          props.authProperty.scope.join(' '),
                        );
                      }}
                    >
                      <MultiSelectItem>{t('Select All')}</MultiSelectItem>
                    </div>
                    <For each={props.authProperty.scope}>
                      {(scope) => (
                        <MultiSelectItem key={scope} value={scope}>
                          <span class="truncate min-w-0">{scope}</span>
                        </MultiSelectItem>
                      )}
                    </For>
                  </MultiSelectList>
                </MultiSelectContent>
              </MultiSelect>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={props.grantType !== OAuth2GrantType.CLIENT_CREDENTIALS}>
        <div class="flex flex-col gap-2">
          {(() => {
            const code = props.form.getValue('request.value.code');
            const hasCode = !isNil(code) && code !== '';
            return (
              <>
                <input
                  type="hidden"
                  value={String(code ?? '')}
                  onInput={(e) =>
                    props.form.setValue(
                      'request.value.code',
                      e.currentTarget.value,
                    )
                  }
                />
                <div class="border border-solid p-2 rounded-lg gap-2 flex text-center items-center justify-center h-full">
                  <div class="rounded-full  border border-solid p-1 flex items-center justify-center">
                    <img src={props.piece.logoUrl} class="w-5 h-5" />
                  </div>
                  <div class="text-sm">{props.piece.displayName}</div>
                  <div class="grow" />
                  <Button
                    size={'sm'}
                    variant={'basic'}
                    class={cn(hasCode && 'text-destructive')}
                    disabled={!isConnectButtonEnabled()}
                    loading={loading()}
                    type="button"
                    onClick={() => {
                      if (!hasCode) {
                        const scopesList = parseScopeString(
                          String(
                            props.form.getValue('request.value.scope') ?? '',
                          ),
                        );
                        void openPopup({
                          redirectUrl,
                          clientId: String(
                            props.form.getValue('request.value.client_id') ??
                              '',
                          ),
                          props: record(
                            props.form.getValue('request.value.props'),
                          ),
                          pieceName: props.piece.name,
                          form: props.form,
                          pieceVersion: props.piece.version,
                          scopes:
                            scopesList.length > 0 ? scopesList : undefined,
                          setLoading,
                        });
                      } else {
                        props.form.setValue('request.value.code', '');
                        props.form.setValue('request.value.code_challenge', '');
                      }
                    }}
                  >
                    {hasCode ? t('Disconnect') : t('Connect')}
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      </Show>
    </div>
  );
}

export { OAuth2ConnectionSettings };

function parseScopeString(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value.split(' ').filter((scope) => scope.length > 0);
}

async function openPopup({
  redirectUrl,
  clientId,
  props,
  pieceName,
  pieceVersion,
  form,
  scopes,
  setLoading,
}: OpenPopupParams) {
  let authorizationUrl, codeVerifier;
  try {
    setLoading(true);
    const formProjectId = String(form.getValue('request.projectId') ?? '');
    const result = await appConnectionsApi.getOAuth2AuthorizationUrl({
      pieceName,
      clientId,
      redirectUrl,
      pieceVersion,
      props,
      projectId: formProjectId,
      scopes,
    });
    authorizationUrl = result.authorizationUrl;
    codeVerifier = result.codeVerifier;
  } catch (error: unknown) {
    form.setError('request.value.client_id', {
      message:
        error instanceof Error
          ? error.message
          : 'Failed to initiate OAuth2 authentication',
    });
    setLoading(false);
    return;
  }
  setLoading(false);
  const { code } = await oauth2Utils.openOAuth2Popup({
    authorizationUrl,
    redirectUrl,
    codeVerifier,
  });
  form.setValue('request.value.code', code);
  form.setValue('request.value.code_challenge', codeVerifier ?? '');
}

function record(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

type OAuth2ConnectionSettingsProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  authProperty: OAuth2Property<OAuth2Props>;
  oauth2App: OAuth2App;
  grantType: OAuth2GrantType;
  form: SolidConnectionForm<unknown>;
};

type OpenPopupParams = {
  redirectUrl: string;
  clientId: string;
  props: Record<string, unknown> | undefined;
  pieceName: string;
  pieceVersion: string;
  scopes: string[] | undefined;
  form: SolidConnectionForm<unknown>;
  setLoading: (loading: boolean) => void;
};
