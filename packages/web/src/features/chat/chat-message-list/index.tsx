import {
  ApErrorParams,
  ChatUIResponse,
  FileResponseInterface,
  isNil,
} from '@activepieces/shared';
import { BotIcon } from 'lucide-solid';
import { For, JSX, Show, splitProps } from 'solid-js';
import { z } from 'zod';

import { cn } from '@/lib/utils';

import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '../chat-bubble';
import { ChatMessage } from '../chat-input';
import { MultiMediaMessage } from '../chat-message';

import { ErrorBubble } from './error-bubble';

export const Messages = z.array(
  z.object({
    role: z.union([z.literal('user'), z.literal('bot')]),
    textContent: z.string().optional(),
    files: z.array(FileResponseInterface).optional(),
  }),
);
export type Messages = z.infer<typeof Messages>;

interface ChatMessageListProps extends JSX.HTMLAttributes<HTMLDivElement> {
  className?: string;
  messagesRef?: HTMLDivElement | ((el: HTMLDivElement) => void);
  messages?: Messages;
  chatUI?: ChatUIResponse | null | undefined;
  sendingError?: ApErrorParams | null;
  isSending?: boolean;
  flowId?: string;
  sendMessage?: (arg0: { isRetrying: boolean; message: ChatMessage }) => void;
  setSelectedImage?: (image: string | null) => void;
}

function ChatMessageList(props: ChatMessageListProps) {
  const [local, rest] = splitProps(props, [
    'className',
    'children',
    'messagesRef',
    'messages',
    'chatUI',
    'sendingError',
    'isSending',
    'flowId',
    'sendMessage',
    'setSelectedImage',
    'ref',
  ]);
  return (
    <Show
      when={local.messages && local.messages.length > 0}
      fallback={
        <div class="h-full w-full flex items-center justify-center overflow-y-auto">
          <div
            class={cn('flex flex-col w-full h-full p-4 gap-2', local.className)}
            ref={local.ref}
            {...rest}
          >
            {local.children}
          </div>
        </div>
      }
    >
      <div class="h-full w-full max-w-3xl flex items-center justify-center overflow-y-auto">
        <div
          class={cn('flex flex-col w-full h-full p-4 gap-2', local.className)}
          ref={local.messagesRef || local.ref}
          {...rest}
        >
          <For each={local.messages}>
            {(message, index) => {
              const isLastMessage = () =>
                index() === (local.messages?.length ?? 0) - 1;
              return (
                <ChatBubble
                  id={isLastMessage() ? 'last-message' : undefined}
                  variant={message.role === 'user' ? 'sent' : 'received'}
                  class={cn('flex items-start', isLastMessage() ? 'pb-8' : '')}
                >
                  <Show when={message.role === 'bot'}>
                    <ChatBubbleAvatar
                      src={local.chatUI?.platformLogoUrl}
                      fallback={<BotIcon class="size-5" />}
                    />
                  </Show>
                  <ChatBubbleMessage
                    class={cn(
                      'flex flex-col gap-2',
                      message.role === 'bot' ? 'w-full' : '',
                    )}
                  >
                    <MultiMediaMessage
                      textContent={message.textContent}
                      attachments={message.files}
                      role={message.role}
                      setSelectedImage={local.setSelectedImage || (() => {})}
                    />
                  </ChatBubbleMessage>
                </ChatBubble>
              );
            }}
          </For>
          <Show
            when={
              local.sendingError &&
              !local.isSending &&
              local.flowId &&
              local.sendMessage
            }
          >
            <ErrorBubble
              chatUI={local.chatUI}
              flowId={local.flowId}
              sendingError={local.sendingError}
              sendMessage={(arg0: {
                isRetrying: boolean;
                message?: ChatMessage;
              }) => {
                if (!isNil(arg0.message)) {
                  local.sendMessage?.({
                    isRetrying: false,
                    message: arg0.message,
                  });
                }
              }}
            />
          </Show>
          <Show when={local.isSending}>
            <ChatBubble variant="received" class="pb-8">
              <ChatBubbleAvatar
                src={local.chatUI?.platformLogoUrl}
                fallback={<BotIcon class="size-5" />}
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          </Show>
        </div>
      </div>
    </Show>
  );
}

export { ChatMessageList };
