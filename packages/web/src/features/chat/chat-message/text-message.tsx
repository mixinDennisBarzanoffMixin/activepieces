import { FileResponseInterface } from '@activepieces/shared';
import { marked } from 'marked';

import { CopyButton } from '@/components/custom/clipboard/copy-button';

interface TextMessageProps {
  content: string;
  role: 'user' | 'bot';
  attachments?: FileResponseInterface[];
}

export const TextMessage = ({ content, role }: TextMessageProps) => {
  return (
    <>
      <div
        class="bg-inherit"
        innerHTML={marked.parse(content, { async: false })}
      />
      {role === 'bot' && (
        <CopyButton
          textToCopy={content}
          tooltipSide="bottom"
          class="size-6 p-1 mt-2"
        />
      )}
    </>
  );
};
TextMessage.displayName = 'TextMessage';
