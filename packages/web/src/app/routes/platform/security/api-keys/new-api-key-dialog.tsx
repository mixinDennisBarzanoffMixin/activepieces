import { ApiKeyResponseWithValue } from '@activepieces/shared';
import { createForm, reset, zodForm } from '@modular-forms/solid';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createSignal, Show } from 'solid-js';
import { z } from 'zod';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiKeyApi } from '@/features/platform-admin';

type NewApiKeyDialogProps = {
  children: JSX.Element;
  onCreate: () => void;
};
const FormSchema = z.object({
  displayName: z.string().min(1, t('Name is required')),
});

type FormSchema = z.infer<typeof FormSchema>;

export const NewApiKeyDialog = ({
  children,
  onCreate,
}: NewApiKeyDialogProps) => {
  const [open, setOpen] = createSignal(false);
  const [apiKey, setApiKey] = createSignal<ApiKeyResponseWithValue | undefined>(
    undefined,
  );
  const [form, { Form, Field }] = createForm<FormSchema>({
    initialValues: {
      displayName: '',
    },
    validate: zodForm(FormSchema),
  });

  const { mutate, isPending } = createMutation({
    mutationFn: apiKeyApi.create,
    onSuccess: (apiKey) => {
      setApiKey(apiKey);
      onCreate();
    },
  });

  return (
    <Dialog
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
        reset(form);
        }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Show when={apiKey} fallback={t('Create API Key')}>
              t('API Key Created'
            </Show>
          </DialogTitle>
          <Show when={!apiKey}>
            <DialogDescription>
              {t(
                'Create a new API key for programmatic access to the platform.',
              )}
            </DialogDescription>
          </Show>
        </DialogHeader>
        <Show when={apiKey}>
          <>
            <div className="p-4">
              <div className="flex flex-col items-start gap-2">
                <span className="text-md">
                  {t(
                    'Please save this secret key somewhere safe and accessible. For security reasons,',
                  )}{' '}
                  <span className="font-semibold">
                    {t(
                      "you won't be able to view it again after closing this dialog.",
                    )}
                  </span>
                </span>
                <CopyToClipboardInput
                  useInput={true}
                  textToCopy={apiKey()?.value ?? ''}
                  fileName={`${apiKey()?.displayName ?? ''}`}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant={'accent'}
                onClick={() => {
                  setApiKey(undefined);
                  setOpen(false);
                }}
                type="button"
              >
                {t('Done')}
              </Button>
            </DialogFooter>
          </>
        </Show>
        <Show when={!apiKey}>
            <Form
              class="grid space-y-4"
              onSubmit={(data) => mutate(data)}
            >
              <Field
                name="displayName"
              >
                {(field, props) => (
                  <div class="grid space-y-4">
                    <Label>{t('Name')}</Label>
                    <Input
                      {...props}
                      value={field.value ?? ''}
                      required
                      placeholder={t('API Key Name')}
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
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button disabled={isPending} loading={isPending}>
                  {t('Create')}
                </Button>
              </DialogFooter>
            </Form>
        </Show>
      </DialogContent>
    </Dialog>
  );
};
