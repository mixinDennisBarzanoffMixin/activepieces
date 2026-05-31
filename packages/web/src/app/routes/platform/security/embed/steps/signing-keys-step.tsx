import { SigningKey } from '@activepieces/shared';
import { t } from 'i18next';
import { Key, MoreHorizontal, Trash } from 'lucide-solid';
import { For } from 'solid-js';

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

export const SigningKeysStep = ({
  signingKeys,
  isLoading,
  refetch,
}: {
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
        <NewSigningKeyDialog onCreate={refetch}>
          <Button size="sm">{t('New Signing Key')}</Button>
        </NewSigningKeyDialog>
      }
    >
      <SigningKeysList
        signingKeys={signingKeys}
        isLoading={isLoading}
        refetch={refetch}
      />
    </StepShell>
  );
};

const SigningKeysList = ({
  signingKeys,
  isLoading,
  refetch,
}: {
  signingKeys: SigningKey[];
  isLoading: boolean;
  refetch: () => void;
}) => {
  if (isLoading) {
    return <SkeletonList numberOfItems={3} class="w-full h-[72px]" />;
  }

  if (signingKeys.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
        <Key class="size-10" />
        <p className="text-sm">{t('No signing keys yet')}</p>
      </div>
    );
  }

  return (
    <ItemGroup class="gap-2">
      <For each={signingKeys}>
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
                <span className="text-xs text-muted-foreground">
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
                    mutationFn={async () => {
                      await signingKeyApi.delete(signingKey.id);
                      refetch();
                    }}
                    onError={() => internalErrorToast()}
                  >
                    <DropdownMenuItem
                      class="text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
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
  );
};
