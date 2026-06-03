import { AIProviderModel, AIProviderName } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-solid';
import {
  createSignal,
  createEffect,
  createMemo,
  For,
  mergeProps,
  Show,
} from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents/ai-providers';
import { cn } from '@/lib/utils';

import { aiModelHooks } from './hooks';

export const PROVIDER_EMBEDDING_MODELS: Partial<
  Record<AIProviderName, string>
> = {
  [AIProviderName.OPENAI]: 'text-embedding-3-small',
  [AIProviderName.GOOGLE]: 'text-embedding-004',
  [AIProviderName.AZURE]: 'text-embedding-3-small',
  [AIProviderName.ACTIVEPIECES]: 'text-embedding-3-small',
  [AIProviderName.OPENROUTER]: 'openai/text-embedding-3-small',
};

type AIModelSelectorProps = {
  defaultProvider?: AIProviderName;
  defaultModel?: string;
  disabled?: boolean;
  onInput: (value: { provider?: string; model?: string }) => void;
};

const ACTIVEPIECES_PROVIDER_CONFIG = {
  provider: AIProviderName.ACTIVEPIECES,
  name: 'Activepieces',
  markdown: '',
  logoUrl: 'https://cdn.activepieces.com/pieces/activepieces.png',
  id: AIProviderName.ACTIVEPIECES,
};

const ALL_PROVIDERS = [...SUPPORTED_AI_PROVIDERS, ACTIVEPIECES_PROVIDER_CONFIG];

export function AIModelSelector(_props: AIModelSelectorProps) {
  const props = mergeProps({ disabled: false }, _props);
  const [providerOpen, setProviderOpen] = createSignal(false);
  const [modelOpen, setModelOpen] = createSignal(false);
  const [selectedProvider, setSelectedProvider] = createSignal<
    AIProviderName | undefined
  >(props.defaultProvider);
  const [selectedModel, setSelectedModel] = createSignal<string | undefined>(
    props.defaultModel,
  );

  const providersQuery = aiModelHooks.useListProviders();
  const modelsQuery = aiModelHooks.useGetModelsForProvider(selectedProvider);

  const providers = createMemo(() => providersQuery.data ?? []);
  const models = createMemo<AIProviderModel[]>(() => modelsQuery.data ?? []);

  const getProviderLogo = (providerName: AIProviderName) => {
    return ALL_PROVIDERS.find(
      (p) => String(p.provider) === providerName.toString(),
    )?.logoUrl;
  };

  const getProviderName = (providerName: AIProviderName) => {
    return (
      providers().find((p) => String(p.provider) === providerName.toString())
        ?.name ?? providerName
    );
  };

  const activepiecesProvider = createMemo(() =>
    providers().find((p) => p.provider === AIProviderName.ACTIVEPIECES),
  );

  const sortedProviders = createMemo(() => {
    return [...providers()].sort((a, b) => {
      if (a.provider === AIProviderName.ACTIVEPIECES) return -1;
      if (b.provider === AIProviderName.ACTIVEPIECES) return 1;
      return 0;
    });
  });

  const selectedEmbedding = createMemo(() => {
    const provider = selectedProvider();
    if (!provider) return undefined;
    return PROVIDER_EMBEDDING_MODELS[provider];
  });

  createEffect(() => {
    if (
      !selectedProvider() &&
      !providersQuery.isLoading &&
      providers().length > 0
    ) {
      const preferred =
        activepiecesProvider()?.provider || providers()[0]?.provider;
      if (preferred) {
        setSelectedProvider(preferred);
      }
    }
  });

  createEffect(() => {
    if (
      selectedProvider() &&
      models().length > 0 &&
      !selectedModel() &&
      !modelsQuery.isLoading
    ) {
      const firstModel = models()[0].id;
      setSelectedModel(firstModel);
      props.onInput({ provider: selectedProvider(), model: firstModel });
    }
  });

  createEffect(() => {
    if (
      selectedModel() &&
      models().length > 0 &&
      !models().some((m) => m.id === selectedModel())
    ) {
      const fallback = models()[0]?.id;
      setSelectedModel(fallback);
      props.onInput({ provider: selectedProvider(), model: fallback });
    }
  });

  const handleProviderChange = (provider: AIProviderName) => {
    setSelectedProvider(provider);
    setSelectedModel(undefined);
    props.onInput({ provider, model: undefined });
    setProviderOpen(false);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    props.onInput({ provider: selectedProvider(), model: modelId });
    setModelOpen(false);
  };

  return (
    <div class="space-y-2">
      <h2 class="text-sm font-medium">{t('AI Model *')}</h2>

      <div class="flex items-stretch border rounded-md bg-background overflow-hidden">
        <Popover open={providerOpen} onOpenChange={setProviderOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={providerOpen()}
              class="flex-1 justify-between border-0 rounded-none focus-visible:ring-1 focus-visible:ring-offset-0 max-w-72 h-auto"
              disabled={
                props.disabled ||
                providersQuery.isLoading ||
                providers().length === 0
              }
            >
              <Show
                when={providersQuery.isLoading}
                fallback={
                  selectedProvider() ? (
                    <div class="flex items-center gap-2">
                      <Show
                        when={
                          selectedProvider() &&
                          getProviderLogo(selectedProvider()!)
                        }
                      >
                        <img
                          src={getProviderLogo(selectedProvider()!)}
                          alt={selectedProvider()}
                          class="h-4 w-4 object-contain"
                        />
                      </Show>
                      <span class="truncate">
                        {selectedProvider()
                          ? getProviderName(selectedProvider()!)
                          : ''}
                      </span>
                    </div>
                  ) : (
                    <span class="text-muted-foreground">
                      {providers().length === 0
                        ? t('No providers')
                        : t('Select provider')}
                    </span>
                  )
                }
              >
                <div class="flex items-center gap-2">
                  <Loader2 class="h-4 w-4 animate-spin" />
                  <span>{t('Loading...')}</span>
                </div>
              </Show>
              <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            class="p-0 w-[var(--radix-popover-trigger-width)]"
            align="start"
          >
            <Command>
              <CommandInput placeholder={t('Search providers...')} />
              <CommandEmpty>{t('No provider found.')}</CommandEmpty>
              <CommandGroup class="max-h-64 overflow-auto">
                <For each={sortedProviders()}>
                  {(provider) => (
                    <CommandItem
                      key={provider.id}
                      value={provider.provider}
                      onSelect={() => handleProviderChange(provider.provider)}
                      class="cursor-pointer"
                    >
                      <div class="flex items-center gap-2 flex-1">
                        <Show when={getProviderLogo(provider.provider)}>
                          <img
                            src={getProviderLogo(provider.provider)}
                            alt={provider.provider}
                            class="h-4 w-4 object-contain"
                          />
                        </Show>
                        <span>{provider.name}</span>
                      </div>
                      <Check
                        class={cn(
                          'ml-auto h-4 w-4',
                          selectedProvider() === provider.provider
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  )}
                </For>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <div class="w-px bg-border self-stretch" />

        <Popover open={modelOpen} onOpenChange={setModelOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={modelOpen()}
              class="flex-1 justify-between border-0 rounded-none focus-visible:ring-1 focus-visible:ring-offset-0 min-w-32 h-auto"
              disabled={
                props.disabled ||
                !selectedProvider() ||
                modelsQuery.isLoading ||
                models().length === 0
              }
            >
              <Show
                when={modelsQuery.isLoading}
                fallback={
                  selectedModel() ? (
                    <span class="truncate">
                      {models().find((m) => m.id === selectedModel())?.name ??
                        selectedModel()}
                    </span>
                  ) : (
                    <span class="text-muted-foreground">
                      {!selectedProvider()
                        ? t('Select provider first')
                        : models().length === 0
                        ? t('No models')
                        : t('Select model')}
                    </span>
                  )
                }
              >
                <div class="flex items-center gap-2">
                  <Loader2 class="h-4 w-4 animate-spin" />
                  <span>{t('Loading...')}</span>
                </div>
              </Show>
              <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            class="p-0 w-[var(--radix-popover-trigger-width)]"
            align="start"
          >
            <Command>
              <CommandInput placeholder={t('Search models...')} />
              <CommandEmpty>{t('No model found.')}</CommandEmpty>
              <CommandGroup class="max-h-64 overflow-auto">
                <For each={models()}>
                  {(model) => (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => handleModelChange(model.id)}
                      class="cursor-pointer"
                    >
                      <span class="flex-1">{model.name}</span>
                      <Check
                        class={cn(
                          'ml-auto h-4 w-4',
                          selectedModel() === model.id
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  )}
                </For>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Show when={selectedProvider()}>
        <p class="text-xs text-muted-foreground">
          {selectedEmbedding()
            ? t('Embedding model for knowledge base: {model}', {
                model: selectedEmbedding(),
              })
            : t('This provider does not support knowledge base embeddings.')}
        </p>
      </Show>
    </div>
  );
}
