import { FileResponseInterface } from '@activepieces/shared';
import { For, Show } from 'solid-js';

import { FileMessage } from './file-message';
import { ImageMessage } from './image-message';
import { TextMessage } from './text-message';

interface MultiMediaMessageProps {
  textContent?: string;
  role: 'user' | 'bot';
  attachments?: FileResponseInterface[];
  setSelectedImage: (image: string | null) => void;
}

export const MultiMediaMessage = (props: MultiMediaMessageProps) => {
  return (
    <div class="flex flex-col gap-2">
      {/* Text content */}
      <Show when={props.textContent}>
        <TextMessage content={props.textContent} role={props.role} />
      </Show>

      {/* Attachments */}
      <Show when={props.attachments && props.attachments.length > 0}>
        <div class="flex flex-col gap-2 mt-2">
          <For each={props.attachments}>
            {(attachment) => {
              if ('url' in attachment && 'mimeType' in attachment) {
                const isImage = attachment.mimeType.startsWith('image/');
                return isImage ? (
                  <ImageMessage
                    content={attachment.url}
                    setSelectedImage={props.setSelectedImage}
                  />
                ) : (
                  <FileMessage
                    content={attachment.url}
                    mimeType={attachment.mimeType}
                    fileName={attachment.fileName}
                    role={props.role}
                  />
                );
              }
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};
