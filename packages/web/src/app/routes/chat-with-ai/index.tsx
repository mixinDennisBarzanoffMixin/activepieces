import { useNavigate, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Ellipsis, Pencil, Trash2 } from 'lucide-solid';
import { createSignal, createEffect, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { chatApi } from '@/features/chat/lib/chat-api';

import { AIChatBox } from './ai-chat-box';
import { TypewriterText } from './components/typewriter-text';
import { ConversationList } from './conversation-list';

export function ChatWithAIPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{
    conversationId: string;
  }>();
  const [resetKey, setResetKey] = createSignal(0);
  const [pendingConversationId, setPendingConversationId] = createSignal<
    string | null
  >(null);
  const [conversationTitle, setConversationTitle] = createSignal<string | null>(
    null,
  );
  const [isRenaming, setIsRenaming] = createSignal(false);
  const [renameValue, setRenameValue] = createSignal('');
  let renameCancelledRef = false;

  const selectedConversationId = urlConversationId ?? null;

  const handleNewChat = () => {
    setResetKey((k) => k + 1);
    setPendingConversationId(null);
    setConversationTitle(null);
    navigate('/chat', { replace: true });
  };

  const handleSelectConversation = (conversationId: string) => {
    setPendingConversationId(null);
    setConversationTitle(null);
    navigate(`/chat/${conversationId}`, {
      replace: true,
    });
  };

  const handleConversationCreated = (conversationId: string) => {
    setPendingConversationId(conversationId);
    window.history.replaceState(null, '', `/chat/${conversationId}`);
    void queryClient.invalidateQueries({
      queryKey: ['chat-conversations'],
    });
  };

  const handleTitleUpdate = (title: string) => {
    setConversationTitle(title);
    void queryClient.invalidateQueries({
      queryKey: ['chat-conversations'],
    });
  };

  const handleRename = async () => {
    if (renameCancelledRef) {
      renameCancelledRef = false;
      return;
    }
    const convId = selectedConversationId ?? pendingConversationId();
    if (!convId || !renameValue().trim()) {
      setIsRenaming(false);
      return;
    }
    renameCancelledRef = true;
    try {
      await chatApi.updateConversation(convId, {
        title: renameValue().trim(),
      });
      setConversationTitle(renameValue().trim());
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations'],
      });
    } catch {
      // keep existing title on failure
    } finally {
      renameCancelledRef = false;
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    const convId = selectedConversationId ?? pendingConversationId();
    if (!convId) return;
    try {
      await chatApi.deleteConversation(convId);
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations'],
      });
      handleNewChat();
    } catch {
      // silently fail — conversation stays
    }
  };

  createEffect(() => {
    if (!selectedConversationId || conversationTitle()) return;
    let cancelled = false;
    chatApi
      .getConversation(selectedConversationId)
      .then((conv) => {
        if (!cancelled && conv.title) setConversationTitle(conv.title);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  });

  createEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'o'
      ) {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const activeConversationId = () =>
    selectedConversationId ?? pendingConversationId();
  const displayTitle = () => conversationTitle() ?? t('New conversation');

  return (
    <div class="flex h-full overflow-hidden">
      <div class="shrink-0 overflow-hidden opacity-40 hover:opacity-100 transition-opacity duration-200">
        <ConversationList
          onNewChat={handleNewChat}
          onSelect={handleSelectConversation}
          selectedId={pendingConversationId() ?? selectedConversationId}
        />
      </div>
      <div class="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        <div class="shrink-0 flex items-center gap-1.5 px-6 py-3 border-b">
          <Show
            when={isRenaming}
            fallback={
              <>
                <TypewriterText
                  text={displayTitle()}
                  class="text-sm font-semibold truncate max-w-[400px]"
                />
                <Show when={activeConversationId()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6 shrink-0"
                      >
                        <Ellipsis class="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameValue(conversationTitle() ?? '');
                          setIsRenaming(true);
                        }}
                      >
                        <Pencil class="h-4 w-4 mr-2" />
                        {t('Rename')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="text-destructive focus:text-destructive"
                        onClick={() => void handleDelete()}
                      >
                        <Trash2 class="h-4 w-4 mr-2" />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Show>
              </>
            }
          >
            <Input
              autoFocus
              value={renameValue()}
              onChange={(e) => setRenameValue(e.currentTarget.value)}
              onBlur={() => void handleRename()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleRename();
                if (e.key === 'Escape') {
                  renameCancelledRef = true;
                  setIsRenaming(false);
                }
              }}
              class="h-7 text-sm font-semibold max-w-[300px]"
            />
          </Show>
        </div>
        <div class="flex-1 min-h-0">
          <AIChatBox
            key={`${selectedConversationId ?? 'new'}-${resetKey()}`}
            incognito={false}
            conversationId={selectedConversationId}
            onTitleUpdate={handleTitleUpdate}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </div>
    </div>
  );
}
