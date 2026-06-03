import type { ChatConversation, SeekPage } from '@activepieces/shared';
import {
  createQuery,
  createMutation,
  useQueryClient,
} from '@tanstack/solid-query';
import { t } from 'i18next';
import { ChevronDown, MessageSquare, Plus, Search, Trash2 } from 'lucide-solid';
import { createMemo, createSignal, createEffect, For, Show } from 'solid-js';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { cn } from '@/lib/utils';

import { DelayedTooltip } from './components/delayed-tooltip';

export function ConversationList(props: {
  onSelect?: (id: string) => void;
  onNewChat?: () => void;
  selectedId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = createSignal<Record<string, boolean>>({});
  const [showTopFade, setShowTopFade] = createSignal(false);
  const [showBottomFade, setShowBottomFade] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  let listRef: HTMLDivElement | undefined;

  const { data: conversationsPage, isLoading: isLoadingConversations } =
    createQuery<SeekPage<ChatConversation>, Error>(() => ({
      queryKey: ['chat-conversations'],
      queryFn: () => chatApi.listConversations({ limit: 100 }),
    }));

  const { mutate: deleteConv } = createMutation(() => ({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: (_data, deletedId) => {
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations'],
      });
      if (props.selectedId === deletedId) {
        props.onNewChat?.();
      }
    },
  }));

  const allConversations = createMemo<ChatConversation[]>(
    () => conversationsPage?.data ?? [],
  );

  const conversations = createMemo(() => {
    if (!searchQuery().trim()) return allConversations();
    const query = searchQuery().toLowerCase();
    return allConversations().filter((c) =>
      (c.title ?? '').toLowerCase().includes(query),
    );
  });

  const checkFades = () => {
    const el = listRef;
    if (!el) return;
    setShowTopFade(el.scrollTop > 5);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 5);
  };

  createEffect(() => {
    checkFades();
  });

  const groups = createMemo(() => {
    const todayStr = new Date().toDateString();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayStr = y.toDateString();

    const groups: {
      today: ChatConversation[];
      yesterday: ChatConversation[];
      older: ChatConversation[];
    } = {
      today: [],
      yesterday: [],
      older: [],
    };
    for (const c of conversations()) {
      const dateStr = new Date(c.created).toDateString();
      if (dateStr === todayStr) groups.today.push(c);
      else if (dateStr === yesterdayStr) groups.yesterday.push(c);
      else groups.older.push(c);
    }
    return groups;
  });

  const handleClick = (conv: ChatConversation) => {
    props.onSelect?.(conv.id);
  };

  const handleDelete = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConv(id);
  };

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderGroup = (label: string, items: ChatConversation[]) => {
    if (items.length === 0) return null;
    const isCollapsed = collapsed()[label];
    return (
      <div class="mb-2 flex flex-col gap-px">
        <button
          type="button"
          class="flex items-center gap-0.5 rounded-md bg-transparent border-none cursor-pointer text-[11px] font-semibold px-2 py-1 uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => toggleGroup(label)}
        >
          {label}
          <ChevronDown
            size={10}
            class={cn(
              'shrink-0 transition-transform duration-150',
              isCollapsed && '-rotate-90',
            )}
          />
        </button>
        <Show when={!isCollapsed}>
          <For each={items}>
            {(conv, index) => (
              <button
                type="button"
                class={cn(
                  'group flex items-center w-full px-2 py-1.5 rounded-md bg-transparent border-none cursor-pointer text-left text-xs transition-all hover:bg-muted relative animate-in fade-in slide-in-from-top-1 duration-200',
                  props.selectedId === conv.id &&
                    'bg-muted font-semibold border-l-2 border-l-primary',
                )}
                style={{ 'animation-delay': `${index() * 30}ms` }}
                onClick={() => handleClick(conv)}
              >
                <span class="overflow-hidden text-ellipsis whitespace-nowrap pr-5 flex-1">
                  {conv.title ?? t('New conversation')}
                </span>
                <DelayedTooltip>
                  <TooltipTrigger asChild>
                    <span
                      role="button"
                      tabIndex={0}
                      class="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      onClick={(e) => handleDelete(e, conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          deleteConv(conv.id);
                        }
                      }}
                    >
                      <Trash2 size={12} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="center"
                    class="pointer-events-none"
                  >
                    {t('Delete')}
                  </TooltipContent>
                </DelayedTooltip>
              </button>
            )}
          </For>
        </Show>
      </div>
    );
  };

  return (
    <div class="flex flex-col h-full shrink-0" style={{ width: '220px' }}>
      <div class="px-2 pt-3 pb-2 space-y-2">
        <button
          type="button"
          class="flex items-center justify-between gap-1.5 w-full px-2 py-1.5 rounded-md border border-border bg-transparent cursor-pointer text-xs text-foreground transition-colors hover:bg-accent"
          onClick={() => {
            props.onNewChat?.();
          }}
        >
          <span class="flex items-center gap-1.5">
            <Plus size={14} />
            {t('New chat')}
          </span>
          <span class="text-[11px] opacity-50">⇧⌘O</span>
        </button>
        <Show when={allConversations().length > 5}>
          <div class="relative">
            <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={searchQuery()}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              placeholder={t('Search...')}
              class="h-7 pl-7 text-xs rounded-md"
            />
          </div>
        </Show>
      </div>
      <div class="flex-1 relative min-h-0">
        <Show when={showTopFade()}>
          <div class="absolute top-0 left-0 right-0 h-5 pointer-events-none z-[1] bg-gradient-to-b from-background to-transparent" />
        </Show>
        <div
          ref={(el) => (listRef = el)}
          onScroll={checkFades}
          class="h-full overflow-y-auto px-2 pb-3 scrollbar-thin"
        >
          <Show
            when={isLoadingConversations}
            fallback={
              <Show
                when={conversations().length === 0}
                fallback={
                  <>
                    {renderGroup(t('Today'), groups().today)}
                    {renderGroup(t('Yesterday'), groups().yesterday)}
                    {renderGroup(t('Older'), groups().older)}
                  </>
                }
              >
                <div class="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <MessageSquare class="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p class="text-xs text-muted-foreground">
                    {searchQuery().trim()
                      ? t('No chats found')
                      : t('Start your first chat')}
                  </p>
                </div>
              </Show>
            }
          >
            <div class="space-y-2 px-2 pt-2">
              <For each={Array.from({ length: 4 })}>
                {() => <Skeleton class="h-7 w-full rounded-md" />}
              </For>
            </div>
          </Show>
        </div>
        <Show when={showBottomFade()}>
          <div class="absolute bottom-0 left-0 right-0 h-[70px] pointer-events-none z-[1] bg-gradient-to-t from-background to-transparent" />
        </Show>
      </div>
    </div>
  );
}
