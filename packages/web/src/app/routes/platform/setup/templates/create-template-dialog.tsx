import {
  TemplateTag as TemplateTagType,
  FlowVersionTemplate,
  TemplateType,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createSignal, Show } from 'solid-js';
import { z } from 'zod';

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
import { templateUtils } from '@/features/flows';
import { templatesApi } from '@/features/templates';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';

import { Textarea } from '../../../../../components/ui/textarea';

const CreateFlowTemplateSchema = z.object({
  displayName: z.string().min(1, t('Name is required')),
  summary: z.string(),
  description: z.string(),
  blogUrl: z.string(),
  template: FlowVersionTemplate,
  tags: z.array(TemplateTagType).optional(),
  categories: z.array(z.string()).optional(),
});

export const CreateTemplateDialog = (props: {
  children: JSX.Element;
  onDone: () => void;
}) => {
  const [open, setOpen] = createSignal(false);
  const { data: currentUser } = userHooks.useCurrentUser();
  const [displayName, setDisplayName] = createSignal('');
  const [blogUrl, setBlogUrl] = createSignal('');
  const [summary, setSummary] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [template, setTemplate] = createSignal<FlowVersionTemplate>();
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const values = () => ({
    displayName: displayName(),
    blogUrl: blogUrl(),
    summary: summary(),
    description: description(),
    tags: [],
    categories: [],
    template: template(),
  });

  const reset = () => {
    setDisplayName('');
    setBlogUrl('');
    setSummary('');
    setDescription('');
    setTemplate(undefined);
    setErrors({});
  };

  const { mutate, isPending } = createMutation(() => ({
    mutationKey: ['create-template'],
    mutationFn: () => {
      const formValue = values();
      const author = currentUser
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : 'Unknown User';
      const flow = formValue.template;

      if (!flow) {
        throw new Error(t('Template is required'));
      }

      const flowTemplate: FlowVersionTemplate = {
        ...flow,
        displayName: formValue.displayName,
        valid: flow.valid === undefined ? true : flow.valid,
      };

      return templatesApi.create({
        flows: [flowTemplate],
        type: TemplateType.CUSTOM,
        name: formValue.displayName,
        summary: formValue.summary,
        description: formValue.description,
        tags: formValue.tags || [],
        blogUrl: formValue.blogUrl,
        metadata: null,
        author,
        categories: formValue.categories || [],
      });
    },
    onSuccess: () => {
      props.onDone();
      setOpen(false);
    },
    onError: (error) => {
      if (api.isError(error)) {
        setErrors({ template: error.message });
      }
    },
  }));

  const onSubmit = () => {
    const parsed = CreateFlowTemplateSchema.safeParse(values());
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        reset();
      }}
    >
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create New Template')}</DialogTitle>
        </DialogHeader>
        <form class="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div class="grid space-y-2">
            <Label for="name" showRequiredIndicator>
              {t('Name')}
            </Label>
            <Input
              required
              id="name"
              value={displayName()}
              onInput={(e) => setDisplayName(e.currentTarget.value)}
              placeholder={t('Template Name')}
              class="rounded-sm"
            />
            <Error message={errors().displayName} />
          </div>
          <div class="grid space-y-2">
            <Label for="summary">{t('Summary')}</Label>
            <Input
              id="summary"
              value={summary()}
              onInput={(e) => setSummary(e.currentTarget.value)}
              placeholder={t('Template Summary')}
              class="rounded-sm"
            />
            <Error message={errors().summary} />
          </div>
          <div class="grid space-y-2">
            <Label for="description">{t('Description')}</Label>
            <Textarea
              required
              id="description"
              value={description()}
              onInput={(e) => setDescription(e.currentTarget.value)}
              class="rounded-sm"
              placeholder={t('Template Description')}
            />
            <Error message={errors().description} />
          </div>
          <div class="grid space-y-2">
            <Label for="blogUrl">{t('Blog URL')}</Label>
            <Input
              required
              id="blogUrl"
              value={blogUrl()}
              onInput={(e) => setBlogUrl(e.currentTarget.value)}
              placeholder={t('Template Blog URL')}
              class="rounded-sm"
            />
            <Error message={errors().blogUrl} />
          </div>
          <div class="grid space-y-2">
            <Label for="template" showRequiredIndicator>
              {t('Template')}
            </Label>
            <Input
              type="file"
              accept=".json"
              onChange={(e) => {
                if (e.target.files) {
                  void e.target.files[0].text().then((text) => {
                    const flowTemplate = templateUtils.extractFlow(text);
                    if (flowTemplate) {
                      setTemplate(flowTemplate);
                      setErrors({ ...errors(), template: '' });
                    } else {
                      setErrors({ ...errors(), template: t('Invalid JSON') });
                    }
                  });
                }
              }}
              required
              id="template"
              placeholder={t('Template')}
              class="rounded-sm"
            />
            <Error message={errors().template} />
          </div>
        </form>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={isPending}
            loading={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSubmit();
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Error = (props: { message: string | undefined }) => (
  <Show when={props.message}>
    <p class="text-sm font-medium text-destructive wrap-break-word">
      {props.message}
    </p>
  </Show>
);
