import { createSignal, type JSX } from 'solid-js';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';

import { queryClient } from '@/app/query-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { samlSsoApi } from '@/features/platform-admin';

export const SamlDomainDialog = ({ children }: SamlDomainDialogProps) => {
  const [open, setOpen] = createSignal(false);
  const [domain, setDomain] = createSignal('');
  const [error, setError] = createSignal('');

  const { mutate, isPending } = createMutation(
    () => ({
      mutationFn: async (value: string) => {
        const { platformId } = await samlSsoApi.discover(
          value.trim().toLowerCase(),
        );
        if (!platformId) {
          throw new Error(t('No SAML provider found for this domain'));
        }
        window.location.href = `/api/v1/authn/saml/login?platformId=${encodeURIComponent(
          platformId,
        )}`;
      },
      onError: (error) => {
        setError(error instanceof Error ? error.message : t('Sign-in failed'));
      },
    }),
    () => queryClient,
  );

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    setError('');
    if (!domain().trim()) {
      setError(t('Domain is required'));
      return;
    }
    mutate(domain());
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setDomain('');
          setError('');
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Sign in with SAML')}</DialogTitle>
        </DialogHeader>
        <form class="flex flex-col gap-4" onSubmit={submit}>
          <p class="text-sm text-muted-foreground">
            {t(
              "Enter your organization's domain to be redirected to your SAML provider.",
            )}
          </p>
          <div class="flex flex-col gap-1.5">
            <Label for="saml-domain">{t('Domain')}</Label>
            <Input
              id="saml-domain"
              value={domain()}
              placeholder="acme.com"
              autoFocus
              onInput={(event) => setDomain(event.currentTarget.value)}
            />
          </div>
          {error() && (
            <p class="text-sm font-medium text-destructive">{error()}</p>
          )}
          <div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} type="button">
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={isPending} disabled={!domain().trim()}>
              {t('Continue')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

type SamlDomainDialogProps = {
  children: JSX.Element;
};
