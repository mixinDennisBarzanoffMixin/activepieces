import { JSX, createContext, useContext } from 'solid-js';

import { ChatStore, ChatStoreState, createChatStore } from './chat-store';

const ChatStoreContext = createContext<ChatStore | null>(null);

const store = createChatStore();

export function ChatStoreProvider(props: { children: JSX.Element }) {
  return (
    <ChatStoreContext.Provider value={store}>
      {props.children}
    </ChatStoreContext.Provider>
  );
}

export function useChatStoreContext<T>(
  selector: (state: ChatStoreState) => T,
): T {
  const store = useContext(ChatStoreContext);
  if (!store)
    throw new Error(
      'useChatStoreContext must be used within ChatStoreProvider',
    );
  return store(selector);
}

export function useChatStoreApi(): ChatStore {
  const store = useContext(ChatStoreContext);
  if (!store)
    throw new Error('useChatStoreApi must be used within ChatStoreProvider');
  return store;
}
