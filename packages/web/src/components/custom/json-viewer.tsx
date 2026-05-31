import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Copy, Download, Eye, EyeOff } from 'lucide-solid';
import { createEffect, createMemo, Show } from 'solid-js';
import { render } from 'solid-js/web';
import { toast } from 'solid-sonner';

import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { isStepFileUrl } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';
import { SolidJsonViewer } from './solid-json-viewer';

type JsonViewerProps = {
  json: any;
  title: any;
  hideDownload?: boolean;
  hideHeader?: boolean;
  className?: string;
};

type FileButtonProps = {
  fileUrl: string;
  handleDownloadFile: (fileUrl: string) => void;
};
const FileButton = ({ fileUrl, handleDownloadFile }: FileButtonProps) => {
  const readonly = fileUrl.includes('file://');
  return (
    <div className="flex items-center gap-0">
      <Button
        variant="ghost"
        size="sm"
        disabled={readonly}
        onClick={() => handleDownloadFile(fileUrl)}
        class="flex items-center gap-2 p-2 max-h-[20px] text-xs"
      >
        <Show when={readonly} fallback={<Eye class="w-4 h-4" />}>
          <EyeOff class="w-4 h-4" />
        </Show>
        {t('Download File')}
      </Button>
    </div>
  );
};

const removeDoubleQuotes = (str: string): string =>
  str.startsWith('"') && str.endsWith('"') ? str.slice(1, -1) : str;

const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, removeUndefined(value)]),
    );
  }
  return obj;
};

const JsonViewer = ({
  json: unclearJson,
  title,
  hideDownload = false,
  hideHeader = false,
  className,
}: JsonViewerProps) => {
  const { theme } = useTheme();
  const json = createMemo(() => {
    return removeUndefined(unclearJson);
  });

  const viewerTheme = theme === 'dark' ? 'bright' : 'rjv-default';
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(json(), null, 2));
    toast.success(t('Copied to clipboard'), {
      duration: 1000,
    });
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(json(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    handleDownloadFile(url);
  };

  const handleDownloadFile = (fileUrl: string, ext = '') => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${typeof title === 'string' ? title : 'data'}${ext}`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  // Note: useLayoutEffect equivalent in Solid is createEffect with queueMicrotask or onMount
  // For DOM manipulation after render, we use createEffect
  createEffect(() => {
    if (typeof json() === 'object') {
      const stringValuesHTML = Array.from(
        document.getElementsByClassName('string-value'),
      );

      const stepFileUrlsHTML = stringValuesHTML.filter(
        (el) =>
          isStepFileUrl(el.innerHTML) ||
          isStepFileUrl(el.parentElement!.nextElementSibling?.innerHTML),
      );

      stepFileUrlsHTML.forEach((el: Element) => {
        const fileUrl = removeDoubleQuotes(el.innerHTML)
          .trim()
          .replace('\n', '');
        el.className += ' hidden';

        const rootElem = document.createElement('div');

        el.parentElement!.replaceChildren(el as Node, rootElem as Node);
        const isProductionFile = fileUrl.includes('file://');

        render(() => (
          <div data-file-root="true">
            <Show
              when={isProductionFile}
              fallback={
                <FileButton
                  fileUrl={fileUrl}
                  handleDownloadFile={handleDownloadFile}
                />
              }
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FileButton
                      fileUrl={fileUrl}
                      handleDownloadFile={handleDownloadFile}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t('File is not available after execution.')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Show>
          </div>
        ), rootElem);
      });
    }
  });

  if (isStepFileUrl(json())) {
    return (
      <FileButton fileUrl={json()} handleDownloadFile={handleDownloadFile} />
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-solid border-dividers overflow-hidden relative',
        className,
      )}
    >
      <Show when={!hideHeader}>
        <div className="px-3 py-2 flex border-solid border-b border-dividers justify-center items-center">
          <div className="grow justify-center items-center">
            <span className="text-md">{title}</span>
          </div>
          <div className="flex items-center gap-0">
            <Show when={!hideDownload}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={'ghost'}
                      size={'sm'}
                      onClick={handleDownload}
                    >
                      <Download class="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t('Download JSON')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Show>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={'ghost'} size={'sm'} onClick={handleCopy}>
                    <Copy class="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t('Copy to clipboard')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </Show>

      <Show
        when={isNil(json())}
        fallback={
          <div>
            <Show when={typeof json() !== 'string' && typeof json() !== 'object'}>
              <pre className="text-sm whitespace-pre-wrap  break-all overflow-x-auto p-2">
                {JSON.stringify(json())}
              </pre>
            </Show>
            <Show when={typeof json() === 'string'}>
              <pre className="text-sm whitespace-pre-wrap break-all overflow-x-auto p-2">
                {json()}
              </pre>
            </Show>
            <Show when={typeof json() === 'object'}>
              <div className="max-w-full">
                <div class="overflow-x-auto break-words p-2">
                  <SolidJsonViewer data={json()} />
                </div>
              </div>
            </Show>
          </div>
        }
      >
        <pre className="text-sm whitespace-pre-wrap overflow-x-auto p-2">
          {json() === null ? 'null' : 'undefined'}
        </pre>
      </Show>
    </div>
  );
};

JsonViewer.displayName = 'JsonViewer';
export { JsonViewer };
