import { ApFlagId, SourceCode } from '@activepieces/shared';
import { t } from 'i18next';
import { Code, Package } from 'lucide-solid';
import { Show, createSignal } from 'solid-js';

import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { AddNpmDialog } from './add-npm-dialog';

type CodeEditorProps = {
  sourceCode: SourceCode;
  onChange: (sourceCode: SourceCode) => void;
  readonly: boolean;
  applyCodeToCurrentStep?: () => void;
  minHeight?: string;
};

const CodeEditor = (props: CodeEditorProps) => {
  const [activeTab, setActiveTab] = createSignal<keyof SourceCode>('code');
  const enabled = () => typeof props.applyCodeToCurrentStep === 'function';

  const { data: allowNpmPackagesInCodeStep } = flagsHooks.useFlag<boolean>(
    ApFlagId.ALLOW_NPM_PACKAGES_IN_CODE_STEP,
  );

  function handlePackageClick() {
    setActiveTab('packageJson');
  }

  function handleCodeClick() {
    setActiveTab('code');
  }

  function handleAddPackages({
    packageName,
    packageVersion,
  }: {
    packageName: string;
    packageVersion: string;
  }) {
    try {
      const parsed: unknown = JSON.parse(props.sourceCode.packageJson);
      const json = {
        ...(isRecord(parsed) ? parsed : {}),
        dependencies: {
          ...(isRecord(parsed) && isRecord(parsed.dependencies)
            ? parsed.dependencies
            : {}),
          [packageName]: packageVersion,
        },
      };
      setActiveTab('packageJson');
      props.onChange({
        code: props.sourceCode.code,
        packageJson: JSON.stringify(json, null, 2),
      });
    } catch (e) {
      console.error(e);
      internalErrorToast();
    }
  }

  return (
    <div class="flex flex-col gap-2 border rounded py-2 px-2 transition-all">
      <div class="flex flex-row justify-center items-center h-full">
        <div class="flex justify-start gap-4 items-center">
          <div
            class={cn('text-sm cursor-pointer', {
              'font-bold': activeTab() === 'code',
            })}
            onClick={() => handleCodeClick()}
          >
            {t('Code')}
          </div>
          <Show when={allowNpmPackagesInCodeStep}>
            <div
              class={cn('text-sm cursor-pointer', {
                'font-bold': activeTab() === 'packageJson',
              })}
              onClick={() => handlePackageClick()}
            >
              {t('Dependencies')}
            </div>
          </Show>
        </div>
        <div class="flex grow" />
        <Show
          when={enabled()}
          fallback={
            allowNpmPackagesInCodeStep && (
              <AddNpmDialog onAdd={handleAddPackages}>
                <Button
                  variant="outline"
                  class="flex gap-2"
                  size={'sm'}
                  onClick={() => {}}
                >
                  <Package class="w-4 h-4" />
                  {t('Add package')}
                </Button>
              </AddNpmDialog>
            )
          }
        >
          <Button
            variant="outline"
            class="flex gap-2"
            size={'sm'}
            onClick={props.applyCodeToCurrentStep}
          >
            <Code class="w-3 h-3" />
            {t('Use code')}
          </Button>
        </Show>
      </div>
      <textarea
        value={
          activeTab() === 'code'
            ? props.sourceCode.code
            : props.sourceCode.packageJson
        }
        class="min-h-[200px] w-full border-none bg-transparent font-mono text-sm outline-none"
        style={{ 'min-height': props.minHeight ?? '200px' }}
        readOnly={props.readonly}
        onInput={(e) => {
          const value = e.currentTarget.value;
          props.onChange(
            activeTab() === 'code'
              ? { code: value, packageJson: props.sourceCode.packageJson }
              : { code: props.sourceCode.code, packageJson: value },
          );
        }}
      />
    </div>
  );
};

export { CodeEditor };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
