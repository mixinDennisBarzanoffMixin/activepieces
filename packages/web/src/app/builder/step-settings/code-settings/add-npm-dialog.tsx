import { createForm, zodForm } from '@modular-forms/solid';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

const formSchema = z.object({
  packageName: z.string().min(1, t('The package name is required')),
});

type AddNpmDialogProps = {
  children: any;
  onAdd: ({
    packageName,
    packageVersion,
  }: {
    packageName: string;
    packageVersion: string;
  }) => void;
};
const AddNpmDialog = ({ children, onAdd }: AddNpmDialogProps) => {
  const [open, setOpen] = createSignal(false);
  const [error, setError] = createSignal('');
  const [form, { Form, Field }] = createForm<z.infer<typeof formSchema>>({
    initialValues: {
      packageName: '',
    },
    validate: zodForm(formSchema),
  });

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const { packageName } = data;
      const response = await api.get<{ 'dist-tags': { latest: string } }>(
        `https://registry.npmjs.org/${packageName}`,
      );
      return {
        packageName,
        packageVersion: response['dist-tags'].latest,
      };
    },
    onSuccess: (response) => {
      onAdd(response);
      setOpen(false);
      toast.success(t('Package added successfully'), {
        duration: 3000,
      });
    },
    onError: () => {
      setError(t('Could not fetch package version'));
    },
  }));

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('Add NPM Package')}</DialogTitle>
          <DialogDescription>
            {t('Type the name of the npm package you want to add.')}
          </DialogDescription>
        </DialogHeader>
        <Form
          onSubmit={(data) => mutate(data)}
          class="flex flex-col gap-4"
        >
            <Field
              name="packageName"
            >
              {(field, props) => (
                <div class="space-y-1">
                  <Label for="packageName">{t('Package Name')}</Label>
                  <Input
                    {...props}
                    value={field.value ?? ''}
                    id="packageName"
                    type="text"
                    placeholder="hello-world"
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
            <FormDescription>
              {t('The latest version will be fetched and added')}
            </FormDescription>
            <Show when={error()}>
              <p class="text-sm font-medium text-destructive wrap-break-word">
                {error()}
              </p>
            </Show>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button type="submit" loading={isPending} onClick={() => form.element?.requestSubmit()}>
            {t('Add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

AddNpmDialog.displayName = 'AddNpmDialog';
export { AddNpmDialog };
