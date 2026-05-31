import { allowedEmbedOriginSchema, ApFlagId } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Loader2 } from 'lucide-solid';
import { createSignal, For, Show } from 'solid-js';
import { toast } from 'solid-sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { TagInput } from '@/components/custom/tag-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { internalErrorToast } from '@/components/ui/sonner';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { StepShell } from '../stepper';

const isValidOrigin = (value: string): boolean =>
  allowedEmbedOriginSchema.safeParse(value).success;

const AllowedOriginsForm = z.object({
  origins: z
    .array(z.string())
    .refine((items) => items.every(isValidOrigin), 'invalidEmbedOrigin'),
});

type AllowedOriginsForm = z.infer<typeof AllowedOriginsForm>;

export const AllowedDomainsStep = ({
  allowedEmbedOrigins,
}: {
  allowedEmbedOrigins: string[];
}) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { data: envAllowedOrigins } = flagsHooks.useFlag<string[]>(
    ApFlagId.ALLOWED_EMBED_ORIGINS,
  );
  const [origins, setOrigins] = createSignal(allowedEmbedOrigins);
  const [error, setError] = createSignal('');

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: async (values: AllowedOriginsForm) => {
      await platformApi.update(
        { allowedEmbedOrigins: values.origins },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Allowed domains updated'));
    },
    onError: () => internalErrorToast(),
  }));

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const parsed = AllowedOriginsForm.safeParse({ origins: origins() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'invalidEmbedOrigin');
      return;
    }
    setError('');
    mutate(parsed.data);
  };

  return (
    <StepShell
      title={t('Add allowed domains')}
      description={t(
        'List the websites that can load your embed in an iframe. All other origins are blocked.',
      )}
    >
      <form onSubmit={submit} className="flex flex-col gap-2">
          <div className="space-y-1">
            <Label>{t('Allowed websites')}</Label>
            <p className="text-xs text-muted-foreground">
              {t(
                'Press Enter or use a comma to add another, e.g. https://app.acme.com',
              )}
            </p>
            <TagInput
              value={origins()}
              onChange={(next) => setOrigins([...next])}
              validateItem={isValidOrigin}
              placeholder="https://app.acme.com"
            />
            <Show when={error()}>
              <p className="text-sm font-medium text-destructive wrap-break-word">
                {t(error())}
              </p>
            </Show>
          </div>
          <Show when={envAllowedOrigins && envAllowedOrigins.length > 0}>
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">
                {t(
                  'These origins are also allowed automatically (configured via AP_ALLOWED_EMBED_ORIGINS):',
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <For each={envAllowedOrigins}>
                  {(d) => (
                    <Badge key={d} variant="outline" class="font-mono text-xs">
                      {d}
                    </Badge>
                  )}
                </For>
              </div>
            </div>
          </Show>
          <div className="flex justify-end mt-6">
            <Button size="sm" type="submit" disabled={isPending}>
              <Show when={isPending}>
                <Loader2 class="size-4 animate-spin mr-2" />
              </Show>
              {t('Save')}
            </Button>
          </div>
        </form>
    </StepShell>
  );
};
