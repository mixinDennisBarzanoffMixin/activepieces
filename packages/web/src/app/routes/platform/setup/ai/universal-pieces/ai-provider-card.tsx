import { AIProviderWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil, Trash } from 'lucide-solid';
import { mergeProps, Show } from 'solid-js';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { ItemMediaImage } from '@/components/custom/item-media-image';
import { Button } from '@/components/ui/button';
import { AiProviderInfo } from '@/features/agents';

import { UpsertAIProviderDialog } from './upsert-provider-dialog';

const AIProviderCard = (_props: AIProviderCardProps) => {
  const props = mergeProps({ allowWrite: true }, _props);
  const logoUrl = () => props.providerInfo.logoUrl;
  const displayName = () =>
    props.providerConfig?.name ?? props.providerInfo.name;

  return (
    <Item variant="outline">
      <Show when={logoUrl()}>
        <ItemMediaImage src={logoUrl()} alt={props.providerInfo.name} />
      </Show>
      <ItemContent>
        <ItemTitle>{displayName()}</ItemTitle>
        <Show when={props.allowWrite}>
          <ItemDescription>
            {t('Configure credentials for {providerName} AI provider.', {
              providerName: props.providerInfo.name,
            })}
          </ItemDescription>
        </Show>
      </ItemContent>
      <Show when={props.allowWrite}>
        <ItemActions>
          <UpsertAIProviderDialog
            key={props.providerConfig?.id ?? props.providerInfo.provider}
            providerId={props.providerConfig?.id}
            config={props.providerConfig?.config}
            provider={props.providerInfo.provider}
            defaultDisplayName={displayName()}
            onSave={props.onSave}
          >
            <Show
              when={props.providerConfig}
              fallback={
                <Button variant={'basic'} size={'sm'}>
                  {t('Enable')}
                </Button>
              }
            >
              <Button variant={'ghost'} size={'sm'}>
                <Pencil class="size-4" />
              </Button>
            </Show>
          </UpsertAIProviderDialog>
          <Show when={props.providerConfig}>
            <ConfirmationDeleteDialog
              title={t('Delete AI Provider')}
              message={t('Are you sure you want to delete {providerName}?', {
                providerName: displayName(),
              })}
              warning={t(
                'All steps using this AI provider will fail after deletion.',
              )}
              entityName={displayName()}
              mutationFn={() => props.onDelete(props.providerConfig.id)}
            >
              <Button variant={'ghost'} size={'sm'}>
                <Trash class="size-4 text-destructive" />
              </Button>
            </ConfirmationDeleteDialog>
          </Show>
        </ItemActions>
      </Show>
    </Item>
  );
};

type AIProviderCardProps = {
  providerInfo: AiProviderInfo;
  providerConfig?: AIProviderWithoutSensitiveData;
  onDelete: (id: string) => Promise<void>;
  onSave: () => void;
  allowWrite?: boolean;
};

export { AIProviderCard };
