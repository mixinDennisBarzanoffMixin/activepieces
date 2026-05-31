import { t } from 'i18next';
import { Copy, Check } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';

import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { SolidJsonViewer } from './solid-json-viewer';

interface SimpleJsonViewerProps {
  data: any;
  readOnly?: boolean;
  hideCopyButton?: boolean;
  maxHeight?: number;
  fontSize?: string;
}

export const SimpleJsonViewer = ({
  data,
  readOnly = true,
  hideCopyButton = false,
  maxHeight = 400,
  fontSize = '14px',
}: SimpleJsonViewerProps) => {
  const [copied, setCopied] = createSignal(false);
  const { theme } = useTheme();

  const formattedJson =
    typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    toast.success(t('Copied to clipboard'), {
      duration: 1000,
    });

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <div
      className="w-full relative text-foreground overflow-hidden"
      style={{
        maxWidth: '100%',
      }}
    >
      <Show when={!hideCopyButton}>
        <div className="absolute top-2 right-5 z-10">
          <Button
            variant="transparent"
            size="sm"
            onClick={handleCopy}
            class="p-0 "
          >
            {copied() ? (
              <Check class="w-4 h-4 text-success" />
            ) : (
              <Copy
                class={`w-4 h-4 ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}
              />
            )}
          </Button>
        </div>
      </Show>
      <div
        className="p-2"
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : '400px',
          overflow: 'auto',
          overflowX: 'auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Show
          when={typeof data === 'string'}
          fallback={
            <div style={{ minWidth: 0, width: '100%', height: '100%' }}>
              <SolidJsonViewer data={data} fontSize={fontSize} />
            </div>
          }
        >
          <pre
            className="whitespace-pre-wrap break-all overflow-x-auto p-2"
            style={{ fontSize }}
          >
            {data}
          </pre>
        </Show>
      </div>
    </div>
  );
};
