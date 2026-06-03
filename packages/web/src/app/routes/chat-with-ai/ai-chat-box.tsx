import type { AIProviderWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { AlertTriangle, RefreshCw, Square } from 'lucide-solid';
import { motion } from 'motion/react';
import { createEffect, createMemo, For, Show } from 'solid-js';

import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from '@/components/prompt-kit/chat-container';
import { ScrollButton } from '@/components/prompt-kit/scroll-button';
import { Button } from '@/components/ui/button';
import {
  ChatStoreProvider,
  useChatStoreContext,
} from '@/features/chat/lib/chat-store-context';
import { useAgentChat } from '@/features/chat/lib/use-chat';
import { useCreditsState } from '@/features/chat/lib/use-credits-state';
import { aiProviderQueries } from '@/features/platform-admin';

import { AssistantMessage } from './components/assistant-message';
import { ChatBottomBar } from './components/chat-bottom-bar';
import {
  EmptyState,
  MessageSkeletons,
  SetupRequiredState,
  SuggestionCards,
} from './components/chat-empty-state';
import { ChatInput } from './components/chat-input';
import { ChatModelSelector } from './components/chat-model-selector';
import { CreditsBanner } from './components/credits-banner';
import { QuickReplies } from './components/quick-replies';
import { UserMessage } from './components/user-message';
import { getTextFromParts } from './lib/message-parsers';

export function AIChatBox(props: AIChatBoxProps) {
  const { data: providers, isLoading: isLoadingProviders } =
    aiProviderQueries.useAiProviders();

  const chatProvider = createMemo<AIProviderWithoutSensitiveData | undefined>(
    () => providers?.find((p) => p.enabledForChat),
  );
  const hasChatProvider = createMemo(() => Boolean(chatProvider()));

  return (
    <Show
      when={isLoadingProviders || hasChatProvider()}
      fallback={<SetupRequiredState />}
    >
      <ChatStoreProvider>
        <ChatBoxContent
          incognito={props.incognito}
          conversationId={props.conversationId}
          onTitleUpdate={props.onTitleUpdate}
          onConversationCreated={props.onConversationCreated}
        />
      </ChatStoreProvider>
    </Show>
  );
}

function ChatBoxContent(props: AIChatBoxProps) {
  const credits = useCreditsState();

  const {
    messages,
    modelName,
    isStreaming,
    wasCancelled,
    isLoadingHistory,
    error,
    sendMessage,
    cancelStream,
    setConversationId,
    setModelName,
  } = useAgentChat({
    onTitleUpdate: (title) => props.onTitleUpdate?.(title),
    onConversationCreated: (id) => props.onConversationCreated?.(id),
    onCreditsExhausted: () => credits.setCreditsExhausted(true),
  });

  const quickReplies = useChatStoreContext((s) => s.quickReplies);

  createEffect(() => {
    if (props.conversationId) {
      void setConversationId(props.conversationId);
    }
  });

  const handleSend = async (text: string, files?: File[]) => {
    if (!text.trim() && (!files || files.length === 0)) return;
    await sendMessage(text.trim(), files);
  };

  const handleRetry = () => {
    const lastUser = messages().findLast((m) => m.role === 'user');
    if (lastUser) void sendMessage(getTextFromParts(lastUser.parts));
  };

  const lastMessage = () => messages()[messages().length - 1];
  const lastAssistantMessage = createMemo(() =>
    messages().findLast((m) => m.role === 'assistant'),
  );

  const isEmpty = () =>
    messages().length === 0 && !isLoadingHistory() && !isStreaming();

  return (
    <Show
      when={!isEmpty()}
      fallback={
        <div class="flex flex-col h-full flex-1 min-w-0 items-center justify-center px-6 pb-8">
          <div class="flex-1" />
          <EmptyState incognito={props.incognito} />
          <div class="w-full max-w-3xl mt-6">
            <SuggestionCards
              onSend={(text, files) => void handleSend(text, files)}
            />
            <div class="mt-3">
              <div class="overflow-hidden rounded-2xl border border-foreground/20 hover:border-foreground/40 focus-within:border-foreground/40 transition-colors">
                <CreditsBanner
                  creditsExhausted={credits.creditsExhausted}
                  creditsWarning={credits.creditsWarning}
                  daysUntilReset={credits.daysUntilReset}
                  onDismiss={credits.dismissCreditsWarning}
                />
                <ChatInput
                  isStreaming={isStreaming()}
                  onSend={(text, files) => void handleSend(text, files)}
                  onStop={cancelStream}
                  rightActions={
                    <ChatModelSelector
                      selectedModel={modelName()}
                      onModelChange={(model) => void setModelName(model)}
                    />
                  }
                />
              </div>
            </div>
          </div>
          <div class="flex-1" />
        </div>
      }
    >
      <div class="flex flex-col h-full flex-1 min-w-0">
        <ChatContainerRoot
          class="flex-1 relative"
          style={{
            'mask-image':
              'linear-gradient(to bottom, black 0%, black calc(100% - 40px), transparent 100%)',
            '-webkit-mask-image':
              'linear-gradient(to bottom, black 0%, black calc(100% - 40px), transparent 100%)',
          }}
        >
          <ChatContainerContent class="max-w-3xl mx-auto px-6 pt-8 pb-16 gap-0">
            <Show when={isLoadingHistory()}>
              <MessageSkeletons />
            </Show>

            <For each={messages()}>
              {(msg, idx) => {
                const last = createMemo(() => idx() === messages().length - 1);
                if (msg.role === 'user') {
                  return <UserMessage message={msg} isLastMessage={last()} />;
                }

                return (
                  <AssistantMessage
                    message={msg}
                    isStreaming={isStreaming() && last()}
                    isLastMessage={last()}
                    onRetry={handleRetry}
                    onSend={(text, files) => void handleSend(text, files)}
                    lastAssistantMessage={last() ? lastAssistantMessage() : msg}
                  />
                );
              }}
            </For>

            <Show
              when={
                !isStreaming() && !wasCancelled() && quickReplies.length > 0
              }
            >
              <QuickReplies
                replies={quickReplies}
                onSend={(text, files) => void handleSend(text, files)}
              />
            </Show>

            <Show when={wasCancelled()}>
              <div class="flex items-center gap-2 py-2 text-xs text-muted-foreground animate-in fade-in duration-200">
                <Square class="h-3 w-3 fill-current" />
                <span>{t('Response stopped')}</span>
              </div>
            </Show>

            <Show when={error()}>
              <motion.div
                class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AlertTriangle class="h-4 w-4 shrink-0" />
                <span class="flex-1">{error()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-destructive hover:text-destructive gap-1.5 shrink-0 h-7 px-2"
                  onClick={handleRetry}
                >
                  <RefreshCw class="h-3 w-3" />
                  {t('Retry')}
                </Button>
              </motion.div>
            </Show>

            <ChatContainerScrollAnchor />
          </ChatContainerContent>
          <ScrollButton class="absolute bottom-4 right-1/2 translate-x-1/2" />
        </ChatContainerRoot>

        <div class="px-6 pb-4">
          <div class="max-w-3xl mx-auto relative">
            <div class="overflow-hidden rounded-2xl border border-foreground/20 hover:border-foreground/40 focus-within:border-foreground/40 transition-colors">
              <CreditsBanner
                creditsExhausted={credits.creditsExhausted}
                creditsWarning={credits.creditsWarning}
                daysUntilReset={credits.daysUntilReset}
                onDismiss={credits.dismissCreditsWarning}
              />
              <ChatBottomBar
                isStreaming={isStreaming()}
                onSend={(text, files) => void handleSend(text, files)}
                onStop={cancelStream}
                selectedModel={modelName()}
                onModelChange={(model) => void setModelName(model)}
                lastAssistantMessage={lastAssistantMessage()}
                lastMessageId={lastMessage().id}
              />
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}

type AIChatBoxProps = {
  incognito: boolean;
  conversationId?: string | null;
  onConversationCreated?: (conversationId: string) => void;
  onTitleUpdate?: (title: string) => void;
};
