import { FileResponseInterface } from '@activepieces/shared';
import { marked } from 'marked';
import { Show } from 'solid-js';

import { CopyButton } from '@/components/custom/clipboard/copy-button';

interface TextMessageProps {
  content: string;
  role: 'user' | 'bot';
  attachments?: FileResponseInterface[];
}

export const TextMessage = (props: TextMessageProps) => {
  return (
    <>
      <div
        class="bg-inherit"
        ref={(el) => {
          el.innerHTML = marked.parse(props.content, { async: false });
        }}
      />
      <Show when={props.role === 'bot'}>
        <CopyButton
          textToCopy={props.content}
          tooltipSide="bottom"
          class="size-6 p-1 mt-2"
        />
      </Show>
    </>
  );
};
