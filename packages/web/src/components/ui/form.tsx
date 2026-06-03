import { t } from 'i18next';
import {
  Controller,
  FormProvider,
  get,
  useFormContext,
  type ControllerProps,
  type FieldValues,
  type CreateFormReturn,
} from 'solid-hook-form';
import {
  Show,
  createContext,
  createUniqueId,
  splitProps,
  useContext,
  type JSX,
} from 'solid-js';

import { Label, type LabelProps } from '@/components/ui/label';
import { Slot } from '@/components/ui/slot';
import { cn } from '@/lib/utils';

function Form<T extends FieldValues>(
  props: { form?: CreateFormReturn<T>; children?: JSX.Element } & Partial<
    CreateFormReturn<T>
  >,
) {
  const [local, rest] = splitProps(props, ['form', 'children']);
  return (
    <FormProvider form={local.form ?? rest}>{local.children}</FormProvider>
  );
}

const FormFieldContext = createContext<FormFieldContextValue>();

const FormField = <TFieldValues extends FieldValues = FieldValues>(
  props: FormFieldProps<TFieldValues>,
) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  if (!itemContext) {
    throw new Error('useFormField should be used within <FormItem>');
  }

  const form = useFormContext();
  const error: unknown = get(form.formState.errors, fieldContext.name);

  const id = itemContext.id;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error,
  };
};

const FormItemContext = createContext<FormItemContextValue>();

function FormItem(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, rest] = splitProps(_props, ['className']);
  const id = createUniqueId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        class={cn('space-y-1', local.className)}
        {...rest}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel(_props: LabelProps) {
  const [local, rest] = splitProps(_props, ['className']);
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      class={cn('data-[error=true]:text-destructive', local.className)}
      for={formItemId}
      {...rest}
    />
  );
}

function FormControl(_props: JSX.HTMLAttributes<HTMLElement>) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {..._props}
    />
  );
}

function FormDescription(_props: ClassName<JSX.IntrinsicElements['p']>) {
  const [local, rest] = splitProps(_props, ['className']);
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      class={cn('text-sm text-muted-foreground', local.className)}
      {...rest}
    />
  );
}

function FormError(
  _props: ClassName<JSX.IntrinsicElements['p']> & { formMessageId: string },
) {
  const [local, rest] = splitProps(_props, [
    'className',
    'children',
    'formMessageId',
  ]);
  return (
    <p
      data-slot="form-error"
      id={local.formMessageId}
      class={cn(
        'text-sm font-medium text-destructive wrap-break-word',
        local.className,
      )}
      {...rest}
    >
      {local.children}
    </p>
  );
}

function FormMessage(_props: ClassName<JSX.IntrinsicElements['p']>) {
  const [local, rest] = splitProps(_props, ['className', 'children']);
  const { error, formMessageId } = useFormField();

  return (
    <Show when={error ? t(fieldMessage(error) ?? '') : local.children}>
      {(body) => (
        <FormError
          data-slot="form-message"
          formMessageId={formMessageId}
          class={local.className}
          {...rest}
        >
          {body()}
        </FormError>
      )}
    </Show>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormError,
};

type FormFieldContextValue = {
  name: string;
};

type FormFieldProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  ControllerProps<TFieldValues>,
  'name'
> & {
  name: string;
};

type FormItemContextValue = {
  id: string;
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};

function fieldMessage(error: unknown) {
  if (typeof error !== 'object' || !error || !('message' in error)) {
    return undefined;
  }
  return typeof error.message === 'string'
    ? error.message
    : String(error.message);
}
