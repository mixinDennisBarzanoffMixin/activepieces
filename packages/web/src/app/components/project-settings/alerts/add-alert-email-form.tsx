import { Permission } from '@activepieces/shared';
import { createForm, reset, zodForm } from '@modular-forms/solid';
import { t } from 'i18next';
import { Plus } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { alertMutations } from '@/features/alerts';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { formatUtils } from '@/lib/format-utils';

export const AddAlertEmailForm = () => {
  const [error, setError] = createSignal('');
  const [form, { Form, Field }] = createForm<FormSchema>({
    initialValues: { email: '' },
    validate: zodForm(FormSchema),
  });
  const { checkAccess } = useAuthorization();
  const writeAlertPermission = checkAccess(Permission.WRITE_ALERT);

  const { mutate, isPending } = alertMutations.useCreateAlert({
    onError: setError,
    onSuccess: () => {
      setError('');
      reset(form);
    },
  });

  return (
    <Form onSubmit={(data) => mutate(data)}>
        <Field
          name="email"
        >
          {(field, props) => (
            <div class="flex flex-col gap-1">
              <div className="flex items-stretch">
                <Input
                  {...props}
                  value={field.value ?? ''}
                  id="alert-email"
                  type="text"
                  placeholder="joe@doe.com"
                  class="h-10 rounded-r-none"
                  disabled={writeAlertPermission === false}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        type="submit"
                        variant="default"
                        class="h-10 rounded-l-none border-l-0 flex items-center gap-2"
                        loading={isPending}
                        disabled={writeAlertPermission === false}
                      >
                        <Plus class="size-4" />
                        <span>{t('Add email')}</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {
                    <Show when={writeAlertPermission === false}>
                      <TooltipContent side="bottom">
                        {t('Only project admins can do this')}
                      </TooltipContent>
                    </Show>
                  }
                </Tooltip>
              </div>
              <Show when={field.error}>
                <p class="text-sm font-medium text-destructive wrap-break-word">
                  {t(field.error)}
                </p>
              </Show>
            </div>
          )}
        </Field>
        <Show when={error()}>
          <p class="mt-1 text-sm font-medium text-destructive wrap-break-word">
            {error()}
          </p>
        </Show>
    </Form>
  );
};

const FormSchema = z.object({
  email: z
    .string()
    .regex(formatUtils.emailRegex, t('Please enter a valid email address')),
});

type FormSchema = z.infer<typeof FormSchema>;
