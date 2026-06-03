import { SigningKey } from '@activepieces/shared';
import { t } from 'i18next';
import { Key, MoreHorizontal, Trash } from 'lucide-solid';
import { For, Match, Switch } from 'solid-js';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SkeletonList } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import { NewSigningKeyDialog, signingKeyApi } from '@/features/platform-admin';
import { formatUtils } from '@/lib/format-utils';

import { StepShell } from '../stepper';

export const SigningKeysStep = (props: {
  signingKeys: SigningKey[];
  isLoading: boolean;
  refetch: () => void;
}) => {
  return (
    <StepShell
      title={t('Add signing keys')}
      description={t(
        "Generate a key to sign each embed session. We'll use the public half to verify your users at runtime.",
      )}
      actions={
        <NewSigningKeyDialog onCreate={props.refetch}>
          <Button size="sm">{t('New Signing Key')}</Button>
        </NewSigningKeyDialog>
      }
    >
      <SigningKeysList
        signingKeys={props.signingKeys}
        isLoading={props.isLoading}
        refetch={props.refetch}
      />
    </StepShell>
  );
};

const SigningKeysList = (props: {
  signingKeys: SigningKey[];
  isLoading: boolean;
  refetch: () => void;
}) => {
  return (
    <Switch>
      <Match when={props.isLoading}>
        <SkeletonList numberOfItems={3} class="w-full h-[72px]" />
      </Match>
      <Match when={props.signingKeys.length === 0}>
        <div class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <Key class="size-10" />
          <p class="text-sm">{t('No signing keys yet')}</p>
        </div>
      </Match>
      <Match when={true}>
        <ItemGroup class="gap-2">
          <For each={props.signingKeys}>
            {(signingKey) => (
              <Item
                key={signingKey.id}
                variant="outline"
                size="sm"
                class="items-center"
              >
                <ItemMedia variant="icon">
                  <Key />
                </ItemMedia>
                <ItemContent class="gap-0">
                  <ItemTitle class="flex items-center gap-2">
                    {signingKey.displayName}
                  </ItemTitle>
                  <ItemDescription class="text-xs">
                    {' ' + t('Created')}{' '}
                    {formatUtils.formatDateToAgo(new Date(signingKey.created))}
                    <br />
                    <span class="text-xs text-muted-foreground">
                      kid: {signingKey.id}
                    </span>
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DropdownMenu modal={true}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" class="size-8 p-0">
                        <MoreHorizontal class="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ConfirmationDeleteDialog
                        title={t('Delete Signing Key')}
                        message={t(
                          'Deleting this signing key will invalidate any tokens signed with it.',
                        )}
                        entityName={t('Signing Key')}
                        buttonText={t('Delete')}
                        mutationFn={() =>
                          signingKeyApi
                            .delete(signingKey.id)
                            .then(props.refetch)
                        }
                        onError={() => internalErrorToast()}
                      >
                        <DropdownMenuItem
                          class="text-destructive focus:text-destructive"
                          onSelect={(event: Event) => {
                            event.preventDefault();
                          }}
                        >
                          <Trash class="size-4 mr-2 text-destructive" />
                          {t('Delete Signing Key')}
                        </DropdownMenuItem>
                      </ConfirmationDeleteDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ItemActions>
              </Item>
            )}
          </For>
        </ItemGroup>
      </Match>
    </Switch>
  );
};
