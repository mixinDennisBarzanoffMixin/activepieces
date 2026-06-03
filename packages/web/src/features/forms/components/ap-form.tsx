import {
  ApFlagId,
  FileResponseInterface,
  FormInput,
  FormInputType,
  FormResponse,
  HumanInputFormResultTypes,
  HumanInputFormResult,
  createKeyForFormInput,
} from '@activepieces/shared';
import { useLocation } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { For, Show, createMemo, createSignal, untrack } from 'solid-js';
import { toast } from 'solid-sonner';
import { z, ZodType } from 'zod';

import { ApMarkdown } from '@/components/custom/markdown';
import { ReadMoreDescription } from '@/components/custom/read-more-description';
import { ShowPoweredBy } from '@/components/custom/show-powered-by';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';

import { Checkbox } from '../../../components/ui/checkbox';
import { humanInputApi } from '../api/human-input-api';

type ApFormProps = {
  form: FormResponse;
  useDraft: boolean;
};
type FormInputWithName = FormInput & {
  name: string;
};

/**We do this because it was the behaviour in previous versions of Activepieces.*/
const putBackQuotesForInputNames = (
  value: Record<string, unknown>,
  inputs: FormInputWithName[],
) => {
  return inputs.reduce((acc, input) => {
    const key = createKeyForFormInput(input.displayName);
    acc[key] = value[key];
    return acc;
  }, {} as Record<string, unknown>);
};

const createPropertySchema = (input: FormInputWithName): ZodType => {
  switch (input.type) {
    case FormInputType.TOGGLE:
      return z.boolean();
    case FormInputType.TEXT:
    case FormInputType.TEXT_AREA:
      return input.required
        ? z.string().min(1, t('This field is required'))
        : z.string();
    case FormInputType.FILE:
      return z.unknown();
  }
};

function buildSchema(inputs: FormInputWithName[]) {
  return {
    properties: z.object(
      inputs.reduce<Record<string, ZodType>>((acc, input) => {
        acc[input.name] = createPropertySchema(input);
        return acc;
      }, {}),
    ),
    defaultValues: inputs.reduce<Record<string, string | boolean>>(
      (acc, input) => {
        acc[input.name] = input.type === FormInputType.TOGGLE ? false : '';
        return acc;
      },
      {},
    ),
  };
}
const handleDownloadFile = (fileBase: FileResponseInterface) => {
  const link = document.createElement('a');
  if ('url' in fileBase) {
    link.href = fileBase.url;
  } else {
    link.download = fileBase.fileName;
    link.href = fileBase.base64Url;
    URL.revokeObjectURL(fileBase.base64Url);
  }
  link.target = '_blank';
  link.rel = 'noreferrer noopener';

  link.click();
};

const ApForm = (props: ApFormProps) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryParamsLowerCase = Array.from(queryParams.entries()).reduce(
    (acc, [key, value]) => {
      acc[key.toLowerCase()] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const inputs = createMemo(() =>
    props.form.props.inputs.map((input) => {
      return {
        ...input,
        name: createKeyForFormInput(input.displayName),
      };
    }),
  );

  const schema = createMemo(() => buildSchema(inputs()));

  const defaultValues = createMemo(() => {
    const values = { ...schema().defaultValues };
    inputs().forEach((input) => {
      const key = input.name.toLowerCase();
      if (key in queryParamsLowerCase) {
        const queryValue = queryParamsLowerCase[key];
        values[input.name] =
          input.type === FormInputType.TOGGLE
            ? queryValue.toLowerCase() === 'true'
            : queryValue;
      }
    });
    return values;
  });

  const [values, setValues] = createSignal<Record<string, unknown>>(
    untrack(defaultValues),
  );
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [markdownResponse, setMarkdownResponse] = createSignal<string | null>(
    null,
  );
  const { data: showPoweredBy } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_POWERED_BY_IN_FORM,
  );

  const { mutate, isPending } = createMutation<
    HumanInputFormResult | null,
    Error,
    Record<string, unknown>
  >(() => ({
    mutationFn: async (data) =>
      humanInputApi.submitForm(
        props.form,
        props.useDraft,
        putBackQuotesForInputNames(data, inputs()),
      ),
    onSuccess: (formResult) => {
      switch (formResult?.type) {
        case HumanInputFormResultTypes.MARKDOWN: {
          setMarkdownResponse(formResult.value);
          if (formResult.files) {
            formResult.files.forEach((file) => {
              handleDownloadFile(file);
            });
          }
          break;
        }
        case HumanInputFormResultTypes.FILE:
          handleDownloadFile(formResult.value);
          break;
        default:
          toast.success(t('Your submission was successfully received.'), {
            duration: 3000,
          });
          break;
      }
    },
    onError: (error) => {
      if (api.isError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          toast.error(t('Flow not found'), {
            description: t(
              'The flow you are trying to submit to does not exist.',
            ),
            duration: 3000,
          });
        } else {
          toast.error(t('The flow failed to execute.'), {
            duration: 3000,
          });
        }
      }
      console.error(error);
    },
  }));

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const parsed = schema().properties.safeParse(values());
    if (!parsed.success) {
      setErrors(
        parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const key = issue.path[0];
          if (typeof key === 'string') {
            acc[key] = issue.message;
          }
          return acc;
        }, {}),
      );
      return;
    }
    setErrors({});
    mutate(values());
  };

  const setValue = (name: string, value: unknown) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      const { [name]: _error, ...rest } = current;
      return rest;
    });
  };

  return (
    <div class="w-full h-full flex">
      <div class="container py-20">
        <form onSubmit={submit}>
          <Card class="w-[500px] mx-auto">
            <CardHeader>
              <CardTitle class="text-center">{props.form.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid w-full items-center gap-3">
                <For each={inputs()}>
                  {(input) => (
                    <>
                      <Show when={input.type === FormInputType.TOGGLE}>
                        <>
                          <div class="flex items-center gap-2 h-full">
                            <Checkbox
                              id={input.name}
                              onCheckedChange={(checked) =>
                                setValue(input.name, checked)
                              }
                              checked={Boolean(values()[input.name])}
                            />
                            <label for={input.name} class="flex items-center">
                              {input.displayName}
                            </label>
                          </div>
                          <ReadMoreDescription text={input.description} />
                        </>
                      </Show>
                      <Show when={input.type !== FormInputType.TOGGLE}>
                        <div class="flex flex-col gap-1">
                          <label
                            for={input.name}
                            class="flex items-center justify-between"
                          >
                            {input.displayName} {input.required && '*'}
                          </label>
                          <div class="flex flex-col gap-1">
                            <Show when={input.type === FormInputType.TEXT_AREA}>
                              <Textarea
                                name={input.name}
                                id={input.name}
                                onInput={(event) =>
                                  setValue(
                                    input.name,
                                    event.currentTarget.value,
                                  )
                                }
                                value={String(values()[input.name] ?? '')}
                              />
                            </Show>
                            <Show when={input.type === FormInputType.TEXT}>
                              <Input
                                onInput={(event) =>
                                  setValue(
                                    input.name,
                                    event.currentTarget.value,
                                  )
                                }
                                id={input.name}
                                name={input.name}
                                value={String(values()[input.name] ?? '')}
                              />
                            </Show>
                            <Show when={input.type === FormInputType.FILE}>
                              <Input
                                name={input.name}
                                id={input.name}
                                onInput={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setValue(input.name, file);
                                  }
                                }}
                                placeholder={input.displayName}
                                type="file"
                              />
                            </Show>
                            <ReadMoreDescription text={input.description} />
                            <Show when={errors()[input.name]}>
                              <p class="text-sm font-medium text-destructive wrap-break-word">
                                {errors()[input.name]}
                              </p>
                            </Show>
                          </div>
                        </div>
                      </Show>
                    </>
                  )}
                </For>
              </div>
              <Button type="submit" class="w-full mt-4" loading={isPending}>
                {t('Submit')}
              </Button>

              <Show when={markdownResponse()}>
                <>
                  <Separator class="my-4" />
                  <ApMarkdown markdown={markdownResponse() ?? ''} />
                </>
              </Show>
            </CardContent>
          </Card>
          <div class="mt-2">
            <ShowPoweredBy position="static" show={showPoweredBy ?? false} />
          </div>
        </form>
      </div>
    </div>
  );
};

export { ApForm };
