import { t } from 'i18next';
import { Copy, Check } from 'lucide-solid';
import { createMemo, createSignal, mergeProps, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';

import { SolidJsonViewer } from './solid-json-viewer';

interface SimpleJsonViewerProps {
  data: unknown;
  readOnly?: boolean;
  hideCopyButton?: boolean;
  maxHeight?: number;
  fontSize?: string;
}

export const SimpleJsonViewer = (_props: SimpleJsonViewerProps) => {
  const props = mergeProps(
    { readOnly: true, hideCopyButton: false, maxHeight: 400, fontSize: '14px' },
    _props,
  );
  const [copied, setCopied] = createSignal(false);
  const { theme } = useTheme();

  const formattedJson = createMemo(() =>
    typeof props.data === 'string'
      ? props.data
      : JSON.stringify(props.data, null, 2),
  );

  const handleCopy = () => {
    void navigator.clipboard.writeText(formattedJson());
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
      class="w-full relative text-foreground overflow-hidden"
      style={{
        'max-width': '100%',
      }}
    >
      <Show when={!props.hideCopyButton}>
        <div class="absolute top-2 right-5 z-10">
          <Button
            variant="transparent"
            size="sm"
            onClick={handleCopy}
            class="p-0 "
          >
            <Show
              when={copied()}
              fallback={
                <Copy
                  class={`w-4 h-4 ${
                    theme === 'dark' ? 'text-white' : 'text-black'
                  }`}
                />
              }
            >
              <Check class="w-4 h-4 text-success" />
            </Show>
          </Button>
        </div>
      </Show>
      <div
        class="p-2"
        style={{
          'max-height':
            typeof props.maxHeight === 'number'
              ? `${props.maxHeight}px`
              : '400px',
          overflow: 'auto',
          'overflow-x': 'auto',
          width: '100%',
          'box-sizing': 'border-box',
        }}
      >
        <Show
          when={typeof props.data === 'string'}
          fallback={
            <div style={{ 'min-width': 0, width: '100%', height: '100%' }}>
              <SolidJsonViewer data={props.data} fontSize={props.fontSize} />
            </div>
          }
        >
          <pre
            class="whitespace-pre-wrap break-all overflow-x-auto p-2"
            style={{ 'font-size': props.fontSize }}
          >
            {props.data}
          </pre>
        </Show>
      </div>
    </div>
  );
};
