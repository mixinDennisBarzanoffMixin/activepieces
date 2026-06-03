import {
  AddSigningKeyRequestBody,
  AddSigningKeyResponse,
} from '@activepieces/shared';
import { createForm, reset, zodForm } from '@modular-forms/solid';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createSignal, JSX, Show } from 'solid-js';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
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
import { Label } from '@/components/ui/label';
import { signingKeyApi } from '@/features/platform-admin/api/signing-key-api';

type NewSigningKeyDialogProps = {
  children: JSX.Element;
  onCreate: () => void;
};

export const NewSigningKeyDialog = (props: NewSigningKeyDialogProps) => {
  const [open, setOpen] = createSignal(false);
  const [signingKey, setSigningKey] = createSignal<
    AddSigningKeyResponse | undefined
  >();
  const [form, { Form, Field }] = createForm<AddSigningKeyRequestBody>({
    initialValues: {
      displayName: '',
    },
    validate: zodForm(AddSigningKeyRequestBody),
  });

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: (body: AddSigningKeyRequestBody) => signingKeyApi.create(body),
    onSuccess: (key) => {
      setSigningKey(key);
      props.onCreate();
    },
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        reset(form);
      }}
    >
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {signingKey() ? t('Signing Key Created') : t('Create Signing Key')}
          </DialogTitle>
        </DialogHeader>
        <Show when={signingKey()}>
          <div class="p-4">
            <div class="flex flex-col items-start gap-2">
              <span class="text-md">
                {t(
                  'Please save this secret key somewhere safe and accessible. For security reasons,',
                )}{' '}
                <span class="font-semibold">
                  {t(
                    "you won't be able to view it again after closing this dialog.",
                  )}
                </span>
              </span>
              <CopyToClipboardInput
                useInput={false}
                fileName={signingKey()?.displayName ?? ''}
                textToCopy={signingKey()?.privateKey ?? ''}
              />
            </div>
          </div>
        </Show>
        <Show when={!signingKey()}>
          <Form class="grid space-y-4" onSubmit={(data) => mutate(data)}>
            <Field name="displayName">
              {(field, props) => (
                <div class="grid space-y-4">
                  <Label for="displayName">{t('Name')}</Label>
                  <Input
                    {...props}
                    value={field.value ?? ''}
                    required
                    id="displayName"
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
          </Form>
        </Show>
        <DialogFooter>
          <Show
            when={!signingKey()}
            fallback={
              <Button
                variant={'accent'}
                onClick={() => {
                  setSigningKey(undefined);
                  setOpen(false);
                }}
              >
                {t('Done')}
              </Button>
            }
          >
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button
                disabled={isPending || form.invalid}
                loading={isPending}
                onClick={() => form.element?.requestSubmit()}
              >
                {t('Save')}
              </Button>
            </>
          </Show>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
