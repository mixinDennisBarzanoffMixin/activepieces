import { FolderDto } from '@activepieces/shared';
import { createForm, reset, zodForm } from '@modular-forms/solid';
import { createMutation } from '@tanstack/solid-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { internalErrorToast } from '@/components/ui/sonner';
import { foldersApi } from '@/features/folders/api/folders-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

type CreateFolderDialogProps = {
  updateSearchParams: (_folderId?: string) => void;
  refetchFolders: () => void;
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CreateFolderFormSchema = z.object({
  displayName: z
    .string({ message: t('Please enter folder name') })
    .regex(/.*\S.*/, t('Please enter folder name')),
});

type CreateFolderFormSchema = z.infer<typeof CreateFolderFormSchema>;

export const CreateFolderDialog = (props: CreateFolderDialogProps) => {
  const [error, setError] = createSignal('');
  const [form, { Form, Field }] = createForm<CreateFolderFormSchema>({
    initialValues: {
      displayName: '',
    },
    validate: zodForm(CreateFolderFormSchema),
  });

  const { mutate, isPending } = createMutation<
    FolderDto,
    Error,
    CreateFolderFormSchema
  >(() => ({
    mutationFn: async (data) => {
      return await foldersApi.create({
        displayName: data.displayName.trim(),
        projectId: authenticationSession.getProjectId()!,
      });
    },
    onSuccess: (folder) => {
      reset(form);
      props.onOpenChange(false);
      props.updateSearchParams(folder.id);
      props.refetchFolders();
      toast.success(t('Added folder successfully'));
    },
    onError: (error) => {
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Conflict: {
            setError(t('The folder name already exists.'));
            break;
          }
          default: {
            internalErrorToast();
            break;
          }
        }
      }
    },
  }));

  const submit = (data: CreateFolderFormSchema) => {
    setError('');
    mutate(data);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create Folder')}</DialogTitle>
          <DialogDescription>
            {t('Organize your automations by grouping them into folders.')}
          </DialogDescription>
        </DialogHeader>
        <Form onSubmit={submit}>
          <Field name="displayName">
            {(field, props) => (
              <div class="space-y-1">
                <Input
                  {...props}
                  value={field.value ?? ''}
                  required
                  id="folder"
                  placeholder={t('Folder Name')}
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
          <Show when={error()}>
            <p class="text-sm font-medium text-destructive wrap-break-word">
              {error()}
            </p>
          </Show>
          <DialogFooter>
            <Button
              variant={'outline'}
              onClick={() => props.onOpenChange(false)}
              type="button"
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={isPending}>
              {t('Create')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
