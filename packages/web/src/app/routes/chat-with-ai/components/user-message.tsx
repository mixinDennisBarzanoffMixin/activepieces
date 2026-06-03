import { t } from 'i18next';
import { Paperclip } from 'lucide-solid';
import { motion } from 'motion/react';
import { createMemo, For, mergeProps, Show } from 'solid-js';

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent as PromptKitMessageContent,
} from '@/components/prompt-kit/message';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';
import { cn } from '@/lib/utils';

import { getTextFromParts } from '../lib/message-parsers';

import { CopyIconButton } from './copy-icon-button';

export function UserMessage(_props: {
  message: ChatUIMessage;
  isLastMessage?: boolean;
}) {
  const props = mergeProps({ isLastMessage: false }, _props);
  const content = createMemo(() => getTextFromParts(props.message.parts));
  const fileNames = createMemo(() =>
    props.message.parts
      .filter(
        (
          p,
        ): p is {
          type: 'file';
          filename: string;
          mediaType: string;
          url: string;
        } =>
          p.type === 'file' &&
          'filename' in p &&
          typeof p.filename === 'string',
      )
      .map((p) => p.filename),
  );

  const isFromHistory = createMemo(() => props.message.id.startsWith('hist-'));

  return (
    <motion.div
      class="flex justify-end py-3 group/msg"
      initial={isFromHistory() ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div class="max-w-[80%]">
        <Message class="flex-row-reverse">
          <div class="bg-muted rounded-2xl rounded-br-md px-2.5 py-1 text-sm">
            <Show when={fileNames().length > 0}>
              <div class="flex flex-wrap gap-1.5 mb-1.5">
                <For each={fileNames()}>
                  {(name) => (
                    <span class="inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
                      <Paperclip class="size-3" />
                      <span class="max-w-[150px] truncate">{name}</span>
                    </span>
                  )}
                </For>
              </div>
            </Show>
            <PromptKitMessageContent markdown class="prose-sm">
              {content()}
            </PromptKitMessageContent>
          </div>
        </Message>
        <MessageActions
          class={cn(
            'justify-end mt-1 transition-opacity',
            props.isLastMessage
              ? 'opacity-100'
              : 'opacity-0 group-hover/msg:opacity-100',
          )}
        >
          <MessageAction tooltip={t('Copy')}>
            <CopyIconButton textToCopy={content()} class="h-6 w-6" />
          </MessageAction>
        </MessageActions>
      </div>
    </motion.div>
  );
}
