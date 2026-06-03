import { t } from 'i18next';
import { Show } from 'solid-js';

import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';

import { ChatInput } from './chat-input';
import { ChatModelSelector } from './chat-model-selector';
import { MultiQuestionForm } from './multi-question-form';
import { PlanApprovalForm } from './plan-approval-form';
import { ToolApprovalForm } from './tool-approval-form';

export function ChatBottomBar(props: ChatBottomBarProps) {
  const hasPlanApproval = useChatStoreContext(
    chatStoreSelectors.hasPlanApproval,
  );
  const pendingPlanApproval = useChatStoreContext((s) => s.pendingPlanApproval);
  const approvePlan = useChatStoreContext((s) => s.approvePlan);
  const rejectPlan = useChatStoreContext((s) => s.rejectPlan);
  const dismissPlan = useChatStoreContext((s) => s.dismissPlan);

  const hasActiveApproval = useChatStoreContext(
    chatStoreSelectors.hasActiveApproval,
  );
  const approvalDisplayName = useChatStoreContext(
    chatStoreSelectors.approvalDisplayName,
  );
  const pendingApprovalRequest = useChatStoreContext(
    (s) => s.pendingApprovalRequest,
  );
  const approveToolCall = useChatStoreContext((s) => s.approveToolCall);
  const rejectToolCall = useChatStoreContext((s) => s.rejectToolCall);
  const dismissApproval = useChatStoreContext((s) => s.dismissApproval);

  const activeQuestions = useChatStoreContext((s) =>
    chatStoreSelectors.activeQuestions({
      state: s,
      lastAssistantMessage: props.lastAssistantMessage,
    }),
  );
  const hasActiveForm = useChatStoreContext((s) =>
    chatStoreSelectors.hasActiveForm({
      state: s,
      lastAssistantMessage: props.lastAssistantMessage,
    }),
  );
  const dismissForm = useChatStoreContext((s) => s.dismissForm);

  return (
    <Show
      when={hasPlanApproval && pendingPlanApproval}
      fallback={
        <Show
          when={hasActiveApproval}
          fallback={
            <Show
              when={hasActiveForm && !props.isStreaming}
              fallback={
                <ChatInput
                  isStreaming={props.isStreaming}
                  onSend={props.onSend}
                  onStop={props.onStop}
                  placeholder={t('Reply...')}
                  rightActions={
                    <ChatModelSelector
                      selectedModel={props.selectedModel}
                      onModelChange={props.onModelChange}
                    />
                  }
                />
              }
            >
              <MultiQuestionForm
                key={props.lastMessageId}
                questions={activeQuestions}
                onSubmit={(text) => {
                  if (props.lastMessageId) dismissForm(props.lastMessageId);
                  void props.onSend(text);
                }}
                onDismiss={() => {
                  if (props.lastMessageId) dismissForm(props.lastMessageId);
                  void props.onSend(t('Skip these questions'));
                }}
              />
            </Show>
          }
        >
          <ToolApprovalForm
            key={pendingApprovalRequest?.gateId}
            displayName={approvalDisplayName ?? ''}
            onApprove={approveToolCall}
            onReject={rejectToolCall}
            onDismiss={dismissApproval}
          />
        </Show>
      }
    >
      <PlanApprovalForm
        key={pendingPlanApproval.gateId}
        planSummary={pendingPlanApproval.planSummary}
        steps={pendingPlanApproval.steps}
        onApprove={approvePlan}
        onReject={rejectPlan}
        onDismiss={dismissPlan}
      />
    </Show>
  );
}

type ChatBottomBarProps = {
  isStreaming: boolean;
  onSend: (text: string, files?: File[]) => void;
  onStop: () => void;
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
  lastAssistantMessage: ChatUIMessage | undefined;
  lastMessageId: string | undefined;
};
