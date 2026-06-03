import {
  ApErrorParams,
  ChatUIResponse,
  ErrorCode,
  isNil,
  HumanInputFormResultTypes,
  HumanInputFormResult,
} from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { AxiosError } from 'axios';
import { nanoid } from 'nanoid';
import { createEffect, createSignal, mergeProps, Show } from 'solid-js';

import { ChatDrawerSource } from '@/app/builder/types';
import { LoadingScreen } from '@/components/custom/loading-screen';
import {
  ChatInput,
  ChatMessage,
  ChatIntro,
  ImageDialog,
  ChatMessageList,
  Messages,
} from '@/features/chat';
import { humanInputApi } from '@/features/forms';
import { cn } from '@/lib/utils';

import NotFoundPage from '../404-page';

interface FlowChatProps {
  flowId: string;
  className?: string;
  showWelcomeMessage?: boolean;
  mode: ChatDrawerSource | null;
  onError?: (error: ApErrorParams | null) => void;
  onSendingMessage?: (message: ChatMessage) => void;
  closeChat?: () => void;
  messages?: Messages;
  chatSessionId?: string | null;
  onAddMessage?: (message: Messages[0]) => void;
  onSetSessionId?: (sessionId: string) => void;
}

export function FlowChat(_props: FlowChatProps) {
  const props = mergeProps({ showWelcomeMessage: true, messages: [] }, _props);
  const messagesRef = null;
  let chatInputRef: HTMLTextAreaElement | undefined;

  const {
    data: chatUI,
    isLoading,
    isError: isLoadingError,
  } = createQuery<ChatUIResponse | null, Error>(() => ({
    queryKey: ['chat', props.flowId],
    queryFn: () =>
      humanInputApi.getChatUI(
        props.flowId,
        props.mode === ChatDrawerSource.TEST_FLOW ||
          props.mode === ChatDrawerSource.TEST_STEP
          ? true
          : false,
      ),
    enabled: !isNil(props.flowId),
    staleTime: Infinity,
    retry: false,
  }));

  const scrollToBottom = () => {
    setTimeout(() => {
      const lastMessage = document.getElementById('last-message');
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Initialize chat session ID if not set and we have the callback
  createEffect(() => {
    if (!props.chatSessionId && props.onSetSessionId) {
      props.onSetSessionId(nanoid());
    }
  });

  let previousInputRef = '';
  let previousFilesRef: File[] = [];
  const [sendingError, setSendingError] = createSignal<ApErrorParams | null>(
    null,
  );
  const [selectedImage, setSelectedImage] = createSignal<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = createSignal(false);

  const botName =
    chatUI?.props.botName ?? `${chatUI?.platformName ?? 'Activepieces'} Bot`;

  const { mutate: sendMessage, isPending: isSending } = createMutation<
    HumanInputFormResult | null,
    AxiosError,
    {
      isRetrying: boolean;
      message?: ChatMessage;
    }
  >(() => ({
    mutationFn: async ({ isRetrying, message }) => {
      if (!props.flowId || !props.chatSessionId) return null;

      const savedInput = isRetrying
        ? previousInputRef
        : message?.textContent || '';
      const savedFiles = isRetrying ? previousFilesRef : message?.files || [];

      previousInputRef = savedInput;
      previousFilesRef = savedFiles;

      if (!isRetrying && message && props.onAddMessage) {
        props.onAddMessage({
          role: 'user',
          textContent: savedInput,
          files: savedFiles.map((file) => ({
            url: URL.createObjectURL(file),
            mimeType: file.type,
          })),
        });
      }

      scrollToBottom();
      const isDraft = props.mode === ChatDrawerSource.TEST_FLOW;
      const isTestStep = props.mode === ChatDrawerSource.TEST_STEP;
      return humanInputApi.sendMessage({
        flowId: props.flowId,
        chatId: props.chatSessionId,
        message: savedInput,
        files: savedFiles,
        mode: isDraft ? 'draft' : isTestStep ? 'test' : 'locked',
      });
    },

    onSuccess: (result) => {
      if (props.mode === ChatDrawerSource.TEST_STEP) {
        props.closeChat?.();
      }
      if (!result) {
        const error: ApErrorParams = {
          code: ErrorCode.NO_CHAT_RESPONSE,
          params: {},
        };
        setSendingError(error);
        props.onError?.(error);
        return;
      }

      if ('type' in result && props.onAddMessage) {
        setSendingError(null);
        props.onError?.(null);

        switch (result.type) {
          case HumanInputFormResultTypes.FILE: {
            if ('url' in result.value) {
              props.onAddMessage({
                role: 'bot',
                files: [
                  {
                    url: result.value.url,
                    mimeType: result.value.mimeType,
                  },
                ],
              });
            }
            break;
          }

          case HumanInputFormResultTypes.MARKDOWN: {
            const validFiles = (result.files ?? []).filter(
              (file) => 'url' in file && 'mimeType' in file,
            );

            props.onAddMessage({
              role: 'bot',
              textContent: result.value,
              files: validFiles.length > 0 ? validFiles : undefined,
            });
            break;
          }
        }
      }

      scrollToBottom();

      setTimeout(() => {
        if (chatInputRef) {
          chatInputRef.focus();
        }
      }, 100);
    },

    onError: (error: AxiosError) => {
      const errorData = error.response?.data as ApErrorParams;
      setSendingError(errorData);
      props.onError?.(errorData);
      scrollToBottom();
    },
  }));

  createEffect(scrollToBottom);

  const handleSendMessage = (message: ChatMessage) => {
    props.onSendingMessage?.(message);
    sendMessage({ isRetrying: false, message });
  };

  if (isLoadingError) {
    return <ChatNotFound />;
  }

  if (isLoading) return <LoadingScreen />;

  const toggleImageDialog = (imageUrl: string | null) => {
    setImageDialogOpen(!!imageUrl);
    setSelectedImage(imageUrl);
  };

  return (
    <main
      class={cn(
        'flex w-full flex-col items-center justify-center pb-6',
        props.messages.length > 0 ? 'h-screen' : 'h-screen',
        props.className,
      )}
    >
      <Show
        when={props.messages.length > 0}
        fallback={
          <>
            <Show when={props.showWelcomeMessage}>
              <ChatIntro chatUI={chatUI} botName={botName} />
            </Show>
            <div class="w-full px-4 max-w-3xl absolute bottom-6">
              <ChatInput
                ref={(el) => (chatInputRef = el)}
                onSendMessage={handleSendMessage}
                disabled={isSending}
                placeholder="Type your message here..."
              />
            </div>
          </>
        }
      >
        <>
          <ChatMessageList
            messagesRef={messagesRef}
            messages={props.messages}
            chatUI={chatUI}
            sendingError={sendingError}
            isSending={isSending}
            flowId={props.flowId}
            sendMessage={sendMessage}
            setSelectedImage={toggleImageDialog}
          />
          <div class="w-full px-4 max-w-3xl">
            <ChatInput
              ref={(el) => (chatInputRef = el)}
              onSendMessage={handleSendMessage}
              disabled={isSending}
              placeholder="Type your message here..."
            />
          </div>
        </>
      </Show>
      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={(open) => {
          setImageDialogOpen(open);
          if (!open) setSelectedImage(null);
        }}
        imageUrl={selectedImage}
      />
    </main>
  );
}

export const ChatNotFound = () => {
  return (
    <NotFoundPage
      title="Hmm... this chat isn't here"
      description="The chat you're looking for isn't here or maybe hasn't been published by the owner yet"
    />
  );
};
