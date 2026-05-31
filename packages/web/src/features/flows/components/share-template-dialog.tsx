import { Template } from '@activepieces/shared';
import { createForm, zodForm } from '@modular-forms/solid';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { JSX, Show, createSignal } from 'solid-js';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flowsApi } from '@/features/flows/api/flows-api';
import { templatesApi } from '@/features/templates/api/templates-api';
import { userHooks } from '@/hooks/user-hooks';
import { useNewWindow } from '@/lib/navigation-utils';

const ShareTemplateSchema = z.object({
  description: z.string(),
  blogUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type ShareTemplateSchema = z.infer<typeof ShareTemplateSchema>;

const ShareTemplateDialog = ({
  children,
  flowId,
  flowVersionId,
}: {
  children: JSX.Element;
  flowId: string;
  flowVersionId: string;
}) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = createSignal(false);
  const [form, { Form, Field }] = createForm<ShareTemplateSchema>({
    initialValues: {
      description: '',
    },
    validate: zodForm(ShareTemplateSchema),
  });
  const openNewIndow = useNewWindow();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { mutate, isPending } = createMutation<
    Template,
    Error,
    { flowId: string; description: string }
  >(() => ({
    mutationFn: async (data) => {
      const template = await flowsApi.getTemplate(data.flowId, {
        versionId: flowVersionId,
      });

      const author = currentUser
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : 'Unknown User';

      const flowTemplate = await templatesApi.create({
        name: template.name,
        description: data.description,
        summary: template.summary,
        tags: template.tags,
        blogUrl: template.blogUrl ?? undefined,
        metadata: template.metadata,
        author,
        categories: template.categories,
        type: template.type,
        flows: template.flows,
      });

      return flowTemplate;
    },
    onSuccess: (data) => {
      openNewIndow(`/templates/${data.id}`);
      setIsShareDialogOpen(false);
    },
  }));

  const submit = (data: ShareTemplateSchema) => {
    mutate({
      flowId,
      description: data.description,
    });
  };

  return (
    <Dialog
      open={isShareDialogOpen}
      onOpenChange={(open) => setIsShareDialogOpen(open)}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Share Template')}</DialogTitle>
          <DialogDescription class="flex flex-col gap-2">
            <span>
              {t(
                'Generate or update a template link for the current flow to easily share it with others.',
              )}
            </span>
            <span>
              {t(
                'The template will not have any credentials in connection fields, keeping sensitive information secure.',
              )}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form class="grid space-y-4" onSubmit={submit}>
          <Field name="description">
            {(field, props) => (
              <div class="grid space-y-2">
                <Label for="description">{t('Description')}</Label>
                <Input
                  {...props}
                  value={field.value ?? ''}
                  required
                  id="description"
                  placeholder={t('A short description of the template')}
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
          <Button loading={isPending}>{t('Share')}</Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { ShareTemplateDialog };
