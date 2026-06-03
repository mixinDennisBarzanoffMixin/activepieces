import { CodeAction, MarkdownVariant } from '@activepieces/shared';
import { t } from 'i18next';

import { BuilderField, useFormContext } from '@/app/builder/builder-form';
import { DictionaryInput } from '@/components/custom/dictionary-input';
import { ApMarkdown } from '@/components/custom/markdown';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { TextInputWithMentions } from '../../piece-properties/text-input-with-mentions';

import { CodeEditor } from './code-editor';

const markdown = `
To use data from previous steps in your code, include them as pairs of keys and values below.

You can access these inputs in your code using \`inputs.key\`, where \`key\` is the name you assigned below.
`;

const warningMarkdown = `
**const code** is the entry to the code. If it is removed or renamed, your step will fail.
`;

type CodeSettingsProps = {
  readonly: boolean;
};

const CodeSettings = (props: CodeSettingsProps) => {
  const form = useFormContext<CodeAction>();

  return (
    <div class="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="settings.input"
        render={({
          field,
        }: {
          field: BuilderField<CodeAction['settings']['input']>;
        }) => (
          <FormItem>
            <div class="pb-4">
              <ApMarkdown markdown={markdown} variant={MarkdownVariant.INFO} />
            </div>
            <div class="flex items-center justify-between mb-2!">
              <FormLabel>{t('Inputs')}</FormLabel>
            </div>

            <DictionaryInput
              disabled={props.readonly}
              values={field.value}
              onChange={field.onChange}
              keyInputClassName="h-[38px]"
              renderValueInput={({ value, onChange, disabled }) => (
                <TextInputWithMentions
                  initialValue={value}
                  disabled={disabled}
                  onChange={onChange}
                />
              )}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <ApMarkdown
          markdown={warningMarkdown}
          variant={MarkdownVariant.WARNING}
        />
      </div>
      <FormField
        control={form.control}
        name="settings.sourceCode"
        render={({
          field,
        }: {
          field: BuilderField<CodeAction['settings']['sourceCode']>;
        }) => (
          <FormItem>
            <CodeEditor
              sourceCode={field.value}
              onChange={field.onChange}
              readonly={props.readonly}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export { CodeSettings };
