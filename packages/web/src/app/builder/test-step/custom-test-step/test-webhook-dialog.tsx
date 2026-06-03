import { FlowAction, ApFlagId, FlowTrigger } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Match, Show, Switch, createSignal } from 'solid-js';
import { z } from 'zod';

import { BuilderField, createForm } from '@/app/builder/builder-form';
import { DictionaryInput } from '@/components/custom/dictionary-input';
import { JsonEditor } from '@/components/custom/json-editor';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';

import { useBuilderStateContext } from '../../builder-hooks';

enum BodyType {
  JSON = 'json',
  TEXT = 'text',
  FORM_DATA = 'form-data',
}

enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
}

const MethodOptions = Object.values(HttpMethod).map((method) => ({
  value: method,
  label: method,
}));

const BodyFormInput = (props: { bodyType: BodyType; field: BuilderField }) => {
  return (
    <Switch>
      <Match when={props.bodyType === BodyType.JSON}>
        <JsonEditor field={props.field} readonly={false} />
      </Match>
      <Match when={props.bodyType === BodyType.TEXT}>
        <Input
          value={String(props.field.value)}
          onChange={props.field.onChange}
          disabled={props.field.disabled}
          ref={props.field.ref}
        />
      </Match>
      <Match when={props.bodyType === BodyType.FORM_DATA}>
        <DictionaryInput
          values={props.field.value}
          onChange={props.field.onChange}
          disabled={false}
        />
      </Match>
    </Switch>
  );
};
const WebhookRequest = z.object({
  bodyType: z.nativeEnum(BodyType),
  body: z.union([z.object({}), z.string()]),
  headers: z.record(z.string(), z.string()),
  queryParams: z.record(z.string(), z.string()),
  method: z.nativeEnum(HttpMethod),
});

type TestWaitForNextWebhookDialogProps = {
  currentStep: FlowAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testingMode: 'returnResponseAndWaitForNextWebhook';
};

type TestTriggerWebhookDialogProps = {
  currentStep: FlowTrigger;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testingMode: 'trigger';
};
type TestWebhookDialogProps =
  | TestWaitForNextWebhookDialogProps
  | TestTriggerWebhookDialogProps;

const TestTriggerWebhookDialog = (props: TestTriggerWebhookDialogProps) => {
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );
  const flowId = useBuilderStateContext((state) => ({
    value: state.flow.id,
  })).value;
  const [isLoading, setIsLoading] = createSignal(false);
  const { mutate: sendRequest } = createMutation<
    unknown,
    Error,
    z.infer<typeof WebhookRequest>
  >(() => ({
    mutationFn: async (data: z.infer<typeof WebhookRequest>) => {
      setIsLoading(true);

      await api.any(`${webhookPrefixUrl}/${flowId}/test`, {
        method: data.method,
        data: data.body,
        headers: data.headers,
        params: data.queryParams,
      });
    },
  }));

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open: boolean) => {
        props.onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Send Sample Data to Webhook')}</DialogTitle>
        </DialogHeader>
        <TestWebhookFunctionalityForm
          showMethodDropdown={true}
          onSubmit={sendRequest}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

const TestWaitForNextWebhookDialog = (
  props: TestWaitForNextWebhookDialogProps,
) => {
  const [updateSampleData] = useBuilderStateContext((state) => [
    state.updateSampleData,
  ]);
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Send Sample Data to Webhook')}</DialogTitle>
        </DialogHeader>
        <TestWebhookFunctionalityForm
          showMethodDropdown={false}
          isLoading={false}
          onSubmit={(data) => {
            updateSampleData({
              stepName: props.currentStep.name,
              output: {
                body: data.body,
                headers: data.headers,
                queryParams: data.queryParams,
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

type TestingWebhookFunctionalityFormProps = {
  onSubmit: (data: z.infer<typeof WebhookRequest>) => void;
  isLoading: boolean;
  showMethodDropdown: boolean;
};

const TestWebhookFunctionalityForm = (
  req: TestingWebhookFunctionalityFormProps,
) => {
  const form = createForm<z.infer<typeof WebhookRequest>>({
    defaultValues: {
      bodyType: BodyType.JSON,
      body: {},
      headers: {},
      queryParams: {},
      method: HttpMethod.GET,
    },
  });

  return (
    <Form {...form}>
      <form
        class="space-y-4"
        onSubmit={form.handleSubmit((data) => req.onSubmit(data))}
      >
        <Show when={req.showMethodDropdown}>
          <FormField
            control={form.control}
            name="method"
            render={(args: FieldArgs<HttpMethod>) => {
              const field = args.field;
              return (
                <FormItem>
                  <FormLabel>{t('Method')}</FormLabel>
                  <SearchableSelect
                    options={MethodOptions}
                    onChange={(val) => {
                      field.onChange(val);
                    }}
                    value={field.value}
                    disabled={false}
                    placeholder={t('Select an option')}
                  />
                </FormItem>
              );
            }}
          />
        </Show>
        <Tabs defaultValue="queryParams">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="queryParams">{t('Query Params')}</TabsTrigger>

            <TabsTrigger value="headers">{t('Headers')}</TabsTrigger>

            <TabsTrigger value="body">{t('Body')}</TabsTrigger>
          </TabsList>
          <TabsContent value="queryParams">
            <FormField
              control={form.control}
              name="queryParams"
              render={(args: FieldArgs<Record<string, string>>) => {
                const field = args.field;
                return (
                  <FormItem>
                    <DictionaryInput
                      values={field.value}
                      onChange={(record) =>
                        field.onChange({ target: { value: record } })
                      }
                      disabled={false}
                    />
                  </FormItem>
                );
              }}
            />
          </TabsContent>

          <TabsContent value="headers">
            <FormField
              control={form.control}
              name="headers"
              render={(args: FieldArgs<Record<string, string>>) => {
                const field = args.field;
                return (
                  <FormItem>
                    <DictionaryInput
                      values={field.value}
                      onChange={(record) =>
                        field.onChange({ target: { value: record } })
                      }
                      disabled={false}
                    />
                  </FormItem>
                );
              }}
            />
          </TabsContent>
          <TabsContent value="body">
            <>
              <FormField
                name="bodyType"
                render={(args: FieldArgs<BodyType>) => {
                  const field = args.field;
                  return (
                    <FormItem>
                      <FormLabel>{t('Type')}</FormLabel>
                      <SearchableSelect
                        options={[
                          {
                            value: BodyType.JSON,
                            label: t('JSON'),
                          },
                          {
                            value: BodyType.TEXT,
                            label: t('Text'),
                          },
                          {
                            value: BodyType.FORM_DATA,
                            label: t('Form Data'),
                          },
                        ]}
                        onChange={(val) => {
                          field.onChange(val);
                          switch (val) {
                            case BodyType.JSON:
                            case BodyType.FORM_DATA:
                              form.setValue('body', {});
                              break;
                            case BodyType.TEXT:
                              form.setValue('body', '');
                              break;
                          }
                        }}
                        value={field.value}
                        disabled={false}
                        placeholder={t('Select an option')}
                        showDeselect={true}
                      />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="body"
                render={(args: FieldArgs<unknown>) => {
                  const field = args.field;
                  return (
                    <FormItem class="mt-4">
                      <FormLabel>{t('Body')}</FormLabel>
                      <BodyFormInput
                        bodyType={form.getValues('bodyType')}
                        field={field}
                      />
                    </FormItem>
                  );
                }}
              />
            </>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button type="submit" loading={req.isLoading}>
            {t('Send')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const TestWebhookDialog = (props: TestWebhookDialogProps) => {
  return (
    <>
      <Show
        when={
          props.testingMode === 'returnResponseAndWaitForNextWebhook'
            ? props
            : undefined
        }
      >
        {(req) => (
          <TestWaitForNextWebhookDialog
            currentStep={req().currentStep}
            open={req().open}
            onOpenChange={req().onOpenChange}
            testingMode={req().testingMode}
          />
        )}
      </Show>
      <Show when={props.testingMode === 'trigger' ? props : undefined}>
        {(req) => (
          <TestTriggerWebhookDialog
            currentStep={req().currentStep}
            open={req().open}
            onOpenChange={req().onOpenChange}
            testingMode={req().testingMode}
          />
        )}
      </Show>
    </>
  );
};

export default TestWebhookDialog;

type FieldArgs<T> = {
  field: BuilderField<T>;
};
