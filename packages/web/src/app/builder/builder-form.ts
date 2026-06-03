import { setAtPath } from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { createForm, useFormContext } from 'solid-hook-form';
import { createSignal } from 'solid-js';
import { z } from 'zod';

function getAtPath(obj: unknown, path: string) {
  return path.match(/([^.[\]])+/g)?.reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function fieldArray<T>({ form, name }: BuilderFieldArrayParams) {
  const read = () => (form.getValues(name) ?? []) as T[];
  const wrap = (values: T[]) =>
    values.map((value) => ({ id: nanoid(), value }));
  const [fields, setFields] = createSignal(wrap(read()));
  const write = (values: T[]) => {
    form.setValue(name, values, { shouldValidate: true });
    setFields(wrap(values));
  };

  return {
    fields,
    append: (value: T) => write([...read(), value]),
    insert: (index: number, value: T) =>
      write([...read().slice(0, index), value, ...read().slice(index)]),
    move: (from: number, to: number) => {
      const values = read();
      const item = values[from];
      if (item === undefined) {
        return;
      }
      write(values.filter((_, index) => index !== from).toSpliced(to, 0, item));
    },
    remove: (index: number) =>
      write(read().filter((_, current) => current !== index)),
    update: (index: number, value: T) =>
      write(read().map((current, idx) => (idx === index ? value : current))),
  };
}

function zodResolver<T>(schema: z.ZodType<T>) {
  return async (values: T) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    return {
      values: {},
      errors: result.error.issues.reduce<
        Record<string, { type: string; message: string }>
      >(
        (errors, issue) => ({
          ...errors,
          [issue.path.join('.')]: {
            type: issue.code,
            message: issue.message,
          },
        }),
        {},
      ),
    };
  };
}

export {
  createForm,
  fieldArray as createBuilderFieldArray,
  getAtPath,
  setAtPath,
  useFormContext,
  zodResolver,
};

export type BuilderField<T = unknown> = {
  value: T;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  ref?: (element: unknown) => void;
};

export type BuilderForm<T = Record<string, unknown>> = ReturnType<
  typeof createForm<T>
>;

type BuilderFieldArrayParams = {
  form: BuilderForm;
  name: string;
};
