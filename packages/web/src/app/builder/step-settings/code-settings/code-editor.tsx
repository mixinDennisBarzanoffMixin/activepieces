import { ApFlagId, SourceCode, deepMergeAndCast } from '@activepieces/shared';
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

const CodeEditor = ({
  sourceCode,
  readonly,
  onChange,
  applyCodeToCurrentStep,
  minHeight,
}: CodeEditorProps) => {
  const { code, packageJson } = sourceCode;
  const [activeTab, setActiveTab] = createSignal<keyof SourceCode>('code');
  const [language, setLanguage] = createSignal<'typescript' | 'json'>(
    'typescript'
  );
  const codeApplicationEnabled = typeof applyCodeToCurrentStep === 'function';

  const { data: allowNpmPackagesInCodeStep } = flagsHooks.useFlag<boolean>(
    ApFlagId.ALLOW_NPM_PACKAGES_IN_CODE_STEP
  );

  function handlePackageClick() {
    setActiveTab('packageJson');
    setLanguage('json');
  }

  function handleCodeClick() {
    setActiveTab('code');
    setLanguage('typescript');
  }

  function handleAddPackages({
    packageName,
    packageVersion,
  }: {
    packageName: string;
    packageVersion: string;
  }) {
    try {
      const json = deepMergeAndCast(JSON.parse(packageJson), {
        dependencies: {
          [packageName]: packageVersion,
        },
      });
      setActiveTab('packageJson');
      onChange({ code, packageJson: JSON.stringify(json, null, 2) });
    } catch (e) {
      console.error(e);
      internalErrorToast();
    }
  }

  return (
    <div className="flex flex-col gap-2 border rounded py-2 px-2 transition-all">
      <div className="flex flex-row justify-center items-center h-full">
        <div className="flex justify-start gap-4 items-center">
          <div
            className={cn('text-sm cursor-pointer', {
              'font-bold': activeTab === 'code',
            })}
            onClick={() => handleCodeClick()}
          >
            {t('Code')}
          </div>
          <Show when={allowNpmPackagesInCodeStep()}>
            <div
              className={cn('text-sm cursor-pointer', {
                'font-bold': activeTab === 'packageJson',
              })}
              onClick={() => handlePackageClick()}
            >
              {t('Dependencies')}
            </div>
          </Show>
        </div>
        <div className="flex grow"></div>
        <Show
          when={codeApplicationEnabled()}
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
            onClick={applyCodeToCurrentStep}
          >
            <Code class="w-3 h-3" />
            {t('Use code')}
          </Button>
        </Show>
      </div>
      <textarea
        value={activeTab === 'code' ? code : packageJson}
        class="min-h-[200px] w-full border-none bg-transparent font-mono text-sm outline-none"
        style={{ 'min-height': minHeight ?? '200px' }}
        readOnly={readonly}
        onInput={(e) => {
          const value = e.currentTarget.value;
          onChange(
            activeTab === 'code'
              ? { code: value, packageJson }
            : { code, packageJson: value }
          );
        }}
      />
    </div>
  );
};

export { CodeEditor };
