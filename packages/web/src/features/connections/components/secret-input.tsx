import {
  SECRET_MANAGER_PROVIDERS_METADATA,
  SecretManagerFieldsSeparator,
} from '@activepieces/shared';
import { t } from 'i18next';
import { KeyRound } from 'lucide-solid';
import { createMemo, createSignal, For, Show, splitProps } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Input, InputProps } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { secretManagersHooks } from '@/features/secret-managers';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

type SecretInputProps = Omit<InputProps, 'value' | 'onInput'> & {
  value?: string;
  onInput?: (value: string) => void;
};

type SecretManagerToggleButtonProps = {
  isActive: boolean;
  onClick: () => void;
};

const SecretManagerToggleButton = (props: SecretManagerToggleButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={props.onClick}
          class={cn('shrink-0', {
            'bg-primary/10': props.isActive,
          })}
        >
          <KeyRound
            class={cn('size-4', {
              'text-primary': props.isActive,
            })}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {props.isActive ? t('Disable Secret Manager') : t('Use Secret Manager')}
      </TooltipContent>
    </Tooltip>
  );
};

function SecretInput(props: SecretInputProps) {
  const [local, rest] = splitProps(props, [
    'className',
    'value',
    'onInput',
    'onBlur',
    'name',
    'disabled',
  ]);

  const { platform } = platformHooks.useCurrentPlatform();
  const { data: connections } =
    secretManagersHooks.useListSecretManagerConnections({
      connectedOnly: true,
    });

  const getSecretParamsForConnection = (connectionId: string | undefined) => {
    if (!connectionId || !connections) return [];
    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) return [];
    const provider = SECRET_MANAGER_PROVIDERS_METADATA.find(
      (p) => p.id === connection.providerId,
    );
    return provider?.secretParams ?? [];
  };

  const [showSecretManagerInput, setShowSecretInput] = createSignal(false);

  const [selectedConnectionId, setSelectedConnectionId] = createSignal<
    string | undefined
  >(undefined);

  const [fieldValues, setFieldValues] = createSignal<Record<string, string>>(
    {},
  );

  const buildSecretValue = (
    connectionId: string | undefined,
    fieldValues: Record<string, string>,
  ): string => {
    const values = getSecretParamsForConnection(connectionId).map(
      (param) => fieldValues[param.name] || '',
    );
    const parts = [connectionId, ...values].join(SecretManagerFieldsSeparator);
    return `{{${parts}}}`;
  };

  const toggleSecretManager = () => {
    const newShowSecretInput = !showSecretManagerInput();
    setShowSecretInput(newShowSecretInput);

    if (newShowSecretInput) {
      const newValue = buildSecretValue(selectedConnectionId(), fieldValues());
      local.onInput?.(newValue);
    } else {
      local.onInput?.('');
    }
  };

  const handleConnectionChange = (newConnectionId: string) => {
    setSelectedConnectionId(newConnectionId);
    const newFieldValues: Record<string, string> = {};
    getSecretParamsForConnection(newConnectionId).forEach((param) => {
      newFieldValues[param.name] = '';
    });
    setFieldValues(newFieldValues);
    const newValue = buildSecretValue(newConnectionId, newFieldValues);
    local.onInput?.(newValue);
  };

  const handleFieldChange = (fieldKey: string, fieldValue: string) => {
    const newFieldValues = { ...fieldValues(), [fieldKey]: fieldValue };
    setFieldValues(newFieldValues);
    const newValue = buildSecretValue(selectedConnectionId(), newFieldValues);
    local.onInput?.(newValue);
  };

  const handleNormalInputChange = (
    e: Event & { currentTarget: HTMLInputElement },
  ) => {
    local.onInput?.(e.currentTarget.value);
  };

  const currentFields = createMemo(() =>
    getSecretParamsForConnection(selectedConnectionId()),
  );

  const getProviderForConnection = (connectionId: string | undefined) => {
    if (!connectionId || !connections) return undefined;
    const connection = connections.find((c) => c.id === connectionId);
    return SECRET_MANAGER_PROVIDERS_METADATA.find(
      (p) => p.id === connection?.providerId,
    );
  };

  const selectedConnection = createMemo(() =>
    connections?.find((c) => c.id === selectedConnectionId()),
  );
  const selectedProvider = createMemo(() =>
    getProviderForConnection(selectedConnectionId()),
  );

  return (
    <Show
      when={showSecretManagerInput()}
      fallback={
        <div class={cn('flex items-center gap-2', local.className)}>
          <Show
            when={
              platform.plan.secretManagersEnabled &&
              connections &&
              connections.length > 0
            }
          >
            <SecretManagerToggleButton
              isActive={false}
              onClick={toggleSecretManager}
            />
          </Show>
          <Input
            name={local.name}
            onBlur={local.onBlur}
            disabled={local.disabled}
            class="flex-1"
            value={local.value ? local.value : ''}
            onInput={handleNormalInputChange}
            type={rest.type}
          />
        </div>
      }
    >
      <div class={cn('flex flex-col gap-2', local.className)}>
        <div class="flex items-center gap-2">
          <SecretManagerToggleButton
            isActive={true}
            onClick={toggleSecretManager}
          />
          <Select
            value={selectedConnectionId()}
            onValueChange={handleConnectionChange}
          >
            <SelectTrigger class="w-64">
              <Show
                when={selectedConnection()}
                fallback={
                  <span class="text-muted-foreground">
                    {t('Select connection')}
                  </span>
                }
              >
                <div class="flex items-center gap-2 min-w-0">
                  <Show when={selectedProvider()?.logo}>
                    <img
                      src={selectedProvider()!.logo}
                      alt={selectedProvider()!.name}
                      class="size-4 shrink-0 object-contain"
                    />
                  </Show>
                  <span class="truncate">{selectedConnection()!.name}</span>
                </div>
              </Show>
            </SelectTrigger>
            <SelectContent>
              {
                <For each={connections}>
                  {(connection) => {
                    const provider = SECRET_MANAGER_PROVIDERS_METADATA.find(
                      (p) => p.id === connection.providerId,
                    );
                    return (
                      <SelectItem key={connection.id} value={connection.id}>
                        <div class="flex items-center gap-2">
                          <Show when={provider?.logo}>
                            <img
                              src={provider.logo}
                              alt={provider.name}
                              class="size-4 shrink-0 object-contain"
                            />
                          </Show>
                          <span>{connection.name}</span>
                        </div>
                      </SelectItem>
                    );
                  }}
                </For>
              }
            </SelectContent>
          </Select>
          <Show
            when={currentFields().length === 0}
            fallback={
              <For each={currentFields()}>
                {(param) => (
                  <Input
                    key={param.name}
                    placeholder={param.placeholder}
                    value={fieldValues()[param.name] || ''}
                    onInput={(e) =>
                      handleFieldChange(param.name, e.currentTarget.value)
                    }
                    disabled={local.disabled}
                    type="text"
                  />
                )}
              </For>
            }
          >
            <Input
              disabled
              type="text"
              class="bg-muted/50 cursor-not-allowed!"
            />
          </Show>
        </div>
      </div>
    </Show>
  );
}

export { SecretInput, type SecretInputProps };
