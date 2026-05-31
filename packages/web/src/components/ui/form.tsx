import { t } from 'i18next';
import {
  Controller,
  FormProvider,
  get,
  useFormContext,
  type ControllerProps,
  type FieldValues,
  type Path,
  type CreateFormReturn,
} from 'solid-hook-form';
import { createContext, createUniqueId, useContext } from 'solid-js';

import { Label, type LabelProps } from '@/components/ui/label';
import { Slot } from '@/components/ui/slot';
import { cn } from '@/lib/utils';

function Form<T extends FieldValues>(
  props: { form?: CreateFormReturn<T>; children?: JSX.Element } & Partial<
    CreateFormReturn<T>
  >,
) {
  const { form, children, ...rest } = props;
  return <FormProvider form={(form ?? rest) as CreateFormReturn<T>}>{children}</FormProvider>;
}

const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
>({
  ...props
}: ControllerProps<TFieldValues>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const form = useFormContext();
  const error = get(form.formState.errors, fieldContext.name);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error,
  };
};

const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

function FormItem({ className, ...props }: JSX.IntrinsicElements['div']) {
  const id = createUniqueId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn('space-y-1', className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({ className, ...props }: LabelProps) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      class={cn('data-[error=true]:text-destructive', className)}
      for={formItemId}
      {...props}
    />
  );
}

function FormControl({ ...props }: JSX.HTMLAttributes<HTMLElement>) {
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
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: JSX.IntrinsicElements['p']) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function FormError({
  className,
  children,
  formMessageId,
  ...props
}: JSX.IntrinsicElements['p'] & { formMessageId: string }) {
  return (
    <p
      data-slot="form-error"
      id={formMessageId}
      className={cn(
        'text-sm font-medium text-destructive wrap-break-word',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

function FormMessage({ className, ...props }: JSX.IntrinsicElements['p']) {
  const { error, formMessageId } = useFormField();
  const body = error ? t(String(error?.message ?? '')) : props.children;

  if (!body) {
    return null;
  }

  return (
    <FormError
      data-slot="form-message"
      formMessageId={formMessageId}
      class={className}
      {...props}
    >
      {body}
    </FormError>
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

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
> = {
  name: Path<TFieldValues>;
};

type FormItemContextValue = {
  id: string;
};
