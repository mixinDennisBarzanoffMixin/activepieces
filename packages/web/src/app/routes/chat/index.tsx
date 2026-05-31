import { isNil, USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/shared';
import { useParams, useSearchParams } from '@solidjs/router';
import { nanoid } from 'nanoid';
import { createSignal, createEffect } from 'solid-js';

import { ChatDrawerSource } from '@/app/builder/types';
import { LoadingScreen } from '@/components/custom/loading-screen';
import { Messages } from '@/features/chat';
import { flowHooks } from '@/features/flows';

import { ChatNotFound, FlowChat } from './flow-chat';

export function ChatPage() {
  const { flowId } = useParams();
  const [searchParams] = useSearchParams();
  const hasDraftSearchParam =
    searchParams[USE_DRAFT_QUERY_PARAM_NAME] === 'true';

  const [messages, setMessages] = createSignal<Messages>([]);
  const [chatSessionId, setChatSessionId] = createSignal<string | null>(null);
  const { data: flow, isLoading } = flowHooks.useGetFlow({
    flowId: flowId ?? '',
  });
  createEffect(() => {
    if (!chatSessionId) {
      setChatSessionId(nanoid());
    }
  });

  const addMessage = (message: Messages[0]) => {
    setMessages((prev) => [...prev, message]);
  };

  if (!flowId) {
    return <ChatNotFound />;
  }
  if (isLoading) {
    return <LoadingScreen />;
  }

  const isDraft =
    hasDraftSearchParam || (flow && isNil(flow.publishedVersionId));
  return (
    <FlowChat
      flowId={flowId}
      mode={isDraft ? ChatDrawerSource.TEST_FLOW : null}
      onSendingMessage={() => {}}
      onError={(error) => {
        console.error('Chat error:', error);
      }}
      messages={messages}
      chatSessionId={chatSessionId}
      onAddMessage={addMessage}
      onSetSessionId={setChatSessionId}
    />
  );
}
