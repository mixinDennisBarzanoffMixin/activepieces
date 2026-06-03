import { isNil } from '@activepieces/shared';
import { createForm, reset, zodForm } from '@modular-forms/solid';
import { t } from 'i18next';
import { Lock, Unlock } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { oauthAppsMutations, oauthAppsQueries } from '@/features/connections';

type ConfigurePieceOAuth2DialogProps = {
  pieceName: string;
  onConfigurationDone: () => void;
  isEnabled: boolean;
  ref?: HTMLButtonElement | ((el: HTMLButtonElement) => void);
};

const OAuth2FormValues = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});
type OAuth2FormValues = z.infer<typeof OAuth2FormValues>;

export function ConfigurePieceOAuth2Dialog(
  props: ConfigurePieceOAuth2DialogProps,
) {
  const [open, setOpen] = createSignal(false);
  const [form, { Form, Field }] = createForm<OAuth2FormValues>({
    initialValues: {
      clientId: '',
      clientSecret: '',
    },
    validate: zodForm(OAuth2FormValues),
  });

  const { oauth2App, refetch } = oauthAppsQueries.useOAuthAppConfigured(
    props.pieceName,
  );
  const { mutate: deleteOAuth2App, isPending: isDeleting } =
    oauthAppsMutations.useDeleteOAuthApp(() => void refetch(), setOpen);
  const { mutate: upsert, isPending: isUpserting } =
    oauthAppsMutations.useUpsertOAuthApp(
      () => void refetch(),
      setOpen,
      props.onConfigurationDone,
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          reset(form);
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={props.ref}
              size={'sm'}
              variant={'ghost'}
              loading={isUpserting || isDeleting}
              disabled={!props.isEnabled}
              onClick={(e) => {
                if (!props.isEnabled) {
                  e.preventDefault();
                  return;
                }
                if (isNil(oauth2App)) {
                  setOpen(true);
                } else {
                  deleteOAuth2App(oauth2App.id);
                  props.onConfigurationDone();
                }
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Show
                when={isNil(oauth2App)}
                fallback={<Lock class="size-4 text-destructive" />}
              >
                <Unlock class="size-4" />
              </Show>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <Show when={isNil(oauth2App)} fallback={t('Delete OAuth2 App')}>
              {t('Configure OAuth2 App')}
            </Show>
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('Configure OAuth2 App')}</DialogTitle>

        <Form
          class="grid space-y-4 mt-4"
          onSubmit={(data) => {
            upsert({
              clientId: data.clientId,
              clientSecret: data.clientSecret,
              pieceName: props.pieceName,
            });
          }}
        >
          <Field name="clientId">
            {(field, props) => (
              <div class="grid space-y-4">
                <Label for="clientId" showRequiredIndicator>
                  {t('Client ID')}
                </Label>
                <Input
                  {...props}
                  value={field.value ?? ''}
                  required
                  id="clientId"
                  class="rounded-sm"
                />
                <Show when={field.error}>
                  <p class="text-sm font-medium text-destructive wrap-break-word">
                    {t(field.error)}
                  </p>
                </Show>
              </div>
            )}
          </Field>
          <Field name="clientSecret">
            {(field, props) => (
              <div class="grid space-y-4">
                <Label for="clientSecret" showRequiredIndicator>
                  {t('Client Secret')}
                </Label>
                <Input
                  {...props}
                  value={field.value ?? ''}
                  required
                  id="clientSecret"
                  class="rounded-sm"
                  type="password"
                />
                <Show when={field.error}>
                  <p class="text-sm font-medium text-destructive wrap-break-word">
                    {t(field.error)}
                  </p>
                </Show>
              </div>
            )}
          </Field>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button loading={isUpserting} disabled={form.invalid} type="submit">
              {t('Save')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
