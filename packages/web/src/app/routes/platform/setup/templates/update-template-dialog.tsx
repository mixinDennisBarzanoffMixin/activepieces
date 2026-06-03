import {
  FlowVersionTemplate,
  TemplateTag as TemplateTagType,
  Template,
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
import { Textarea } from '@/components/ui/textarea';
import { templateUtils } from '@/features/flows';
import { templatesApi } from '@/features/templates';
import { api } from '@/lib/api';

const UpdateFlowTemplateSchema = z.object({
  displayName: z.string().min(1, t('Name is required')),
  summary: z.string(),
  description: z.string(),
  blogUrl: z.string(),
  template: z.unknown().optional(),
  tags: z.array(TemplateTagType).optional(),
  categories: z.array(z.string()).optional(),
});

export const UpdateTemplateDialog = (props: {
  children: JSX.Element;
  onDone: () => void;
  template: Template;
}) => {
  const [open, setOpen] = createSignal(false);
  const initial = () => ({
    displayName: props.template.name,
    summary: props.template.summary || '',
    blogUrl: props.template.blogUrl || '',
    description: props.template.description,
    tags: props.template.tags || [],
    categories: props.template.categories || [],
    template: undefined,
  });
  const [displayName, setDisplayName] = createSignal(initial().displayName);
  const [blogUrl, setBlogUrl] = createSignal(initial().blogUrl);
  const [summary, setSummary] = createSignal(initial().summary);
  const [description, setDescription] = createSignal(initial().description);
  const [flow, setFlow] = createSignal<FlowVersionTemplate>();
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const values = () => ({
    displayName: displayName(),
    blogUrl: blogUrl(),
    summary: summary(),
    description: description(),
    tags: initial().tags,
    categories: initial().categories,
    template: flow(),
  });

  const reset = () => {
    setDisplayName(initial().displayName);
    setBlogUrl(initial().blogUrl);
    setSummary(initial().summary);
    setDescription(initial().description);
    setFlow(undefined);
    setErrors({});
  };

  const { mutate, isPending } = createMutation(() => ({
    mutationKey: ['update-template', props.template.id],
    mutationFn: () => {
      const formValue = values();
      const next = formValue.template;

      return templatesApi.update(props.template.id, {
        name: formValue.displayName,
        summary: formValue.summary,
        description: formValue.description,
        tags: formValue.tags,
        blogUrl: formValue.blogUrl,
        metadata: props.template.metadata,
        categories: formValue.categories || [],
        flows: next
          ? [
              {
                ...next,
                displayName: formValue.displayName,
                valid: next.valid === undefined ? true : next.valid,
              },
            ]
          : undefined,
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
    const parsed = UpdateFlowTemplateSchema.safeParse(values());
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
        if (!open) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Update Template')}</DialogTitle>
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
            <Label for="template">{t('Template')}</Label>
            <Input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void file.text().then((text) => {
                    const template = templateUtils.extractFlow(text);
                    if (template) {
                      setFlow(template);
                      setErrors({ ...errors(), template: '' });
                    } else {
                      setErrors({ ...errors(), template: t('Invalid JSON') });
                    }
                  });
                }
              }}
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
