import { Show } from 'solid-js';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { DownloadButton } from '../download-button';

import { CopyButton } from './copy-button';

type CopyToClipboardInputProps = {
  textToCopy: string;
  useInput: boolean;
  fileName?: string;
};

const noBorderInputClass = `border-none w-full rfocus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0`;

const CopyToClipboardInput = (props: CopyToClipboardInputProps) => {
  return (
    <div class="flex gap-2 items-center bg-background border border-solid text-sm rounded block w-full select-none pr-3">
      <Show
        when={props.useInput}
        fallback={
          <Textarea
            value={props.textToCopy}
            rows={6}
            class={noBorderInputClass}
            readOnly
          />
        }
      >
        <Input value={props.textToCopy} class={noBorderInputClass} readOnly />
      </Show>
      <div
        class={cn('flex  gap-1', {
          'flex-col': !props.useInput,
        })}
      >
        <CopyButton textToCopy={props.textToCopy} variant="ghost" />
        <Show when={props.fileName}>
          <DownloadButton
            textToDownload={props.textToCopy}
            fileName={props.fileName}
            variant="ghost"
            tooltipSide="bottom"
          />
        </Show>
      </div>
    </div>
  );
};

export { CopyToClipboardInput };
