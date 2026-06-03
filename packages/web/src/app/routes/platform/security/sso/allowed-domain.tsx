import {
  PlatformWithoutSensitiveData,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Plus, X } from 'lucide-solid';
import { createMemo, createSignal, For, Show } from 'solid-js';
import { toast } from 'solid-sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export const AllowedDomainDialog = (props: AllowedDomainDialogProps) => {
  const initial = () =>
    props.platform.allowedAuthDomains.map((domain) => domain);
  const [open, setOpen] = createSignal(false);
  const [domains, setDomains] = createSignal(initial());
  const valid = createMemo(
    () =>
      AllowedDomainsFormValues.safeParse({
        allowedAuthDomains: domains().map((domain) => ({ domain })),
      }).success,
  );

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: async (request: UpdatePlatformRequestBody) => {
      await platformApi.update(request, props.platform.id);
      await props.refetch();
    },
    onSuccess: () => {
      toast.success(t('Allowed domains updated'), {
        duration: 3000,
      });
      setOpen(false);
    },
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setDomains(initial());
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button size={'sm'} variant={'basic'} onClick={() => setOpen(true)}>
          <Show
            when={props.platform.allowedAuthDomains.length > 0}
            fallback={t('Enable')}
          >
            {t('Update')}
          </Show>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Configure Allowed Domains')}</DialogTitle>
        </DialogHeader>
        <form
          class="grid space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutate({
              allowedAuthDomains: domains(),
              enforceAllowedAuthDomains: domains().length > 0,
            });
          }}
        >
          <div class="flex flex-col gap-1">
            <div class="text-muted-foreground text-sm">
              {t(
                'Enter the allowed domains for the users to authenticate with. An empty list will allow all domains.',
              )}
            </div>
          </div>
          <For each={domains()}>
            {(domain, index) => (
              <div class="grid space-y-4">
                <div class="flex space-x-2">
                  <Input
                    id={`allowedAuthDomains.${index()}`}
                    value={domain}
                    onInput={(e) =>
                      setDomains((domains) =>
                        domains.map((domain, idx) =>
                          idx === index() ? e.currentTarget.value : domain,
                        ),
                      )
                    }
                    placeholder={t('example.com')}
                    class="rounded-sm"
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      setDomains((domains) =>
                        domains.filter((_, idx) => idx !== index()),
                      )
                    }
                    variant="outline"
                    size="sm"
                    class="h-10"
                  >
                    <X class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </For>
          <Button
            type="button"
            onClick={() => setDomains((domains) => [...domains, ''])}
            variant="outline"
            size="sm"
          >
            <Plus class="size-4" />
            {t('Add Domain')}
          </Button>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
            >
              {t('Cancel')}
            </Button>
            <Button loading={isPending} disabled={!valid()} type="submit">
              {t('Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AllowedDomainsFormValues = z.object({
  allowedAuthDomains: z.array(
    z.object({
      domain: z.string().min(1),
    }),
  ),
});

type AllowedDomainsFormValues = z.infer<typeof AllowedDomainsFormValues>;

type AllowedDomainDialogProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};
