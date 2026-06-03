import {
  FlowRun,
  RunEnvironment,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { ArrowRight } from 'lucide-solid';
import { Show } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ChatDrawerSource } from '@/app/builder/types';
import { useSocket } from '@/components/providers/socket-provider';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

import { FlowChat } from './flow-chat';

export const ChatDrawer = () => {
  const state = useBuilderStateContext((state) => ({
    chatSessionMessages: state.chatSessionMessages,
    chatSessionId: state.chatSessionId,
    addChatMessage: state.addChatMessage,
    flowVersion: state.flowVersion,
    setChatSessionId: state.setChatSessionId,
    setRun: state.setRun,
    chatDrawerOpenSource: state.chatDrawerOpenSource,
    setChatDrawerOpenSource: state.setChatDrawerOpenSource,
  }));
  const socket = useSocket();
  let isListening = false;
  //shouldn't use testFlow hook here because it would run the flow with sample data not the real user message
  const listenToTestRun = () => {
    isListening = true;
    const onTestFlowRunStarted = (run: FlowRun) => {
      if (
        run.flowVersionId === state.flowVersion.id &&
        run.environment === RunEnvironment.TESTING &&
        isListening
      ) {
        state.setRun(run, state.flowVersion);
        isListening = false;
        socket.off(
          WebsocketClientEvent.TEST_FLOW_RUN_STARTED,
          onTestFlowRunStarted,
        );
      }
    };
    socket.on(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, onTestFlowRunStarted);
  };
  return (
    <Show when={state.chatDrawerOpenSource !== null}>
      <Drawer
        open={true}
        onOpenChange={() => state.setChatDrawerOpenSource(null)}
        direction="right"
        dismissible={false}
        modal={false}
      >
        <DrawerContent class="w-[500px] overflow-x-hidden">
          <DrawerHeader>
            <div class="p-4">
              <div class="flex items-center gap-1">
                <Button
                  variant="basic"
                  size={'icon'}
                  class="text-foreground"
                  onClick={() => state.setChatDrawerOpenSource(null)}
                >
                  <ArrowRight class="h-5 w-5" />
                </Button>
                <DrawerTitle>Chat</DrawerTitle>
              </div>
            </div>
          </DrawerHeader>
          <div class="flex-1 overflow-hidden">
            <FlowChat
              flowId={state.flowVersion.flowId}
              class="h-full"
              mode={state.chatDrawerOpenSource}
              showWelcomeMessage={true}
              onError={() => {}}
              onSendingMessage={() => {
                if (state.chatDrawerOpenSource === ChatDrawerSource.TEST_FLOW) {
                  listenToTestRun();
                }
              }}
              closeChat={() => {
                state.setChatDrawerOpenSource(null);
              }}
              messages={state.chatSessionMessages}
              chatSessionId={state.chatSessionId}
              onAddMessage={state.addChatMessage}
              onSetSessionId={state.setChatSessionId}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </Show>
  );
};
