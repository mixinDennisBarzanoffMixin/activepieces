import {
  ErrorCode,
  formErrors,
  VARIABLE_NAME_REGEX,
  VariableWithoutSensitiveData,
} from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-solid';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { internalErrorToast } from '@/components/ui/sonner';
import { variablesApi } from '@/features/variables/api/variables';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

const FormSchema = z.object({
  name: z
    .string()
    .min(1, formErrors.required)
    .regex(VARIABLE_NAME_REGEX, 'invalidVariableName'),
  value: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

type VariableDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: VariableWithoutSensitiveData;
  onSaved?: (variable: VariableWithoutSensitiveData) => void;
};

type VariableFormProps = {
  existing?: VariableWithoutSensitiveData;
  onOpenChange: (open: boolean) => void;
  onSaved?: (variable: VariableWithoutSensitiveData) => void;
};

export function VariableDialog(props: VariableDialogProps) {
  const { open, onOpenChange, existing, onSaved } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent class="max-w-md">
        <VariableForm
          key={open ? `${existing?.id ?? 'new'}-open` : 'closed'}
          existing={existing}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function VariableForm(props: VariableFormProps) {
  const { existing, onOpenChange, onSaved } = props;
  const isEdit = !!existing;
  const projectId = authenticationSession.getProjectId();
  const [valueVisible, setValueVisible] = createSignal(false);
  const [showValueField, setShowValueField] = createSignal(!isEdit);
  const [values, setValues] = createSignal<FormValues>({
    name: existing?.name ?? '',
    value: '',
  });
  const [errors, setErrors] = createSignal<
    Partial<Record<keyof FormValues, string>>
  >({});

  const { mutate: save, isPending } = createMutation(() => ({
    mutationFn: async (values: FormValues) => {
      if (!projectId) {
        throw new Error('No project');
      }
      if (existing) {
        return variablesApi.update(existing.id, { value: values.value });
      }
      return variablesApi.create({
        projectId,
        name: values.name,
        value: values.value ?? '',
      });
    },
    onSuccess: (variable) => {
      toast.success(isEdit ? t('Variable updated') : t('Variable created'));
      onSaved?.(variable);
      onOpenChange(false);
    },
    onError: (error) => {
      if (api.isApError(error, ErrorCode.VALIDATION)) {
        setErrors({ name: 'Variable name already used' });
        return;
      }
      internalErrorToast();
    },
  }));

  const setValue = (name: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const parsed = FormSchema.safeParse(values());
    if (!parsed.success) {
      setErrors(
        parsed.error.issues.reduce<Partial<Record<keyof FormValues, string>>>(
          (acc, issue) => {
            const key = issue.path[0];
            if (key === 'name' || key === 'value') {
              return { ...acc, [key]: issue.message };
            }
            return acc;
          },
          {},
        ),
      );
      return;
    }
    if (!parsed.data.value) {
      setErrors({ value: formErrors.required });
      return;
    }
    setErrors({});
    save(parsed.data);
  };

  return (
    <form class="flex flex-col gap-4" onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? t('Edit variable') : t('New variable')}
        </DialogTitle>
        <DialogDescription>
          {t(
            'Store an API key, token, or other value you can reuse across flow steps without exposing it.',
          )}
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-2">
        <label class="text-sm font-medium leading-none" for="variable-name">
          {t('Name')}
        </label>
        <Input
          id="variable-name"
          name="name"
          disabled={isEdit}
          placeholder="STRIPE_PROD"
          value={values().name}
          onInput={(event) => setValue('name', event.currentTarget.value)}
        />
        <Show when={errors().name}>
          <p class="text-sm font-medium text-destructive wrap-break-word">
            {t(errors().name ?? '')}
          </p>
        </Show>
      </div>
      <Show when={!isEdit || showValueField()}>
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none" for="variable-value">
            {t('Value')}
          </label>
          <div class="relative">
            <Input
              id="variable-value"
              name="value"
              type={valueVisible() ? 'text' : 'password'}
              autoComplete="new-password"
              class="pr-10"
              value={values().value ?? ''}
              onInput={(event) => setValue('value', event.currentTarget.value)}
              placeholder={isEdit ? t('Enter new value') : t('Enter the value')}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setValueVisible((v) => !v)}
              aria-label={valueVisible() ? t('Hide value') : t('Show value')}
            >
              <Show when={valueVisible()} fallback={<Eye class="h-4 w-4" />}>
                <EyeOff class="h-4 w-4" />
              </Show>
            </Button>
          </div>
          <Show when={errors().value}>
            <p class="text-sm font-medium text-destructive wrap-break-word">
              {t(errors().value ?? '')}
            </p>
          </Show>
        </div>
      </Show>
      <Show when={isEdit && !showValueField()}>
        <Button
          type="button"
          variant="outline"
          class="w-full"
          onClick={() => setShowValueField(true)}
        >
          {t('Rotate value')}
        </Button>
      </Show>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {isEdit && !showValueField() ? t('Close') : t('Cancel')}
          </Button>
        </DialogClose>
        <Show when={!isEdit || showValueField()}>
          <Button type="submit" loading={isPending}>
            {isEdit ? t('Save new value') : t('Create')}
          </Button>
        </Show>
      </DialogFooter>
    </form>
  );
}
