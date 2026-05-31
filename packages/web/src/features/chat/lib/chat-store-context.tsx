import { createWithStore } from 'solid-zustand';
import { createContext, useContext } from 'solid-js';

import { ChatStore, ChatStoreState, createChatStore } from './chat-store';

const ChatStoreContext = createContext<ChatStore | null>(null);

export function ChatStoreProvider({ children }: { children: any }) {
  const storeRef = null;
  if (!storeRef.current) {
    storeRef.current = createChatStore();
  }
  return (
    <ChatStoreContext.Provider value={storeRef.current}>
      {children}
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
  return createWithStore(store)(selector);
}

export function useChatStoreApi(): ChatStore {
  const store = useContext(ChatStoreContext);
  if (!store)
    throw new Error('useChatStoreApi must be used within ChatStoreProvider');
  return store;
}
