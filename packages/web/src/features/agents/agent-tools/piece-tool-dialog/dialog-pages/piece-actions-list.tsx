import { AgentTool, isNil, mcpToolNameUtils } from '@activepieces/shared';
import Fuse from 'fuse.js';
import { t } from 'i18next';
import { Search } from 'lucide-solid';
import { createMemo, createSignal, For, Show } from 'solid-js';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from '@/lib/debounce';

import { usePieceToolsDialogStore } from '../../stores/pieces-tools';

interface PieceActionsDialogProps {
  tools: AgentTool[];
}

export const PieceActionsList = (props: PieceActionsDialogProps) => {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [debouncedQuery] = useDebounce(searchQuery, 200);
  const { handleActionSelect, selectedPiece } = usePieceToolsDialogStore();

  const selectedActionNames = createMemo(
    () => new Set(props.tools.map((tool) => tool.toolName)),
  );

  const fuse = createMemo(() => {
    if (isNil(selectedPiece) || isNil(selectedPiece.suggestedActions))
      return null;

    return new Fuse(selectedPiece.suggestedActions, {
      keys: [
        { name: 'displayName', weight: 0.8 },
        { name: 'description', weight: 0.2 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  });

  const filteredActions = createMemo(() => {
    if (!debouncedQuery().trim() || isNil(fuse()))
      return selectedPiece?.suggestedActions || [];

    return fuse()
      .search(debouncedQuery())
      .map((r) => r.item);
  });

  return (
    <Show when={selectedPiece} fallback={<p>{t('No app is selected')}</p>}>
      {(piece) => (
        <ScrollArea class="overflow-y-auto">
          <div class="px-4 py-3 border-b">
            <div class="relative border rounded-sm">
              <Search class="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={t('Search')}
                value={searchQuery}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                class="pl-9 shadow-none border-none"
              />
            </div>
          </div>

          <div class="flex p-4 flex-col gap-2">
            <For each={filteredActions()}>
              {(action) => {
                const isDisabled = selectedActionNames().has(
                  mcpToolNameUtils.createPieceToolName(
                    piece().pieceName,
                    action.name,
                  ),
                );

                return (
                  <div
                    class={`
                p-2 flex items-center gap-x-2 rounded-lg transition
                ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-accent cursor-pointer'
                }
              `}
                    onClick={() => {
                      if (!isDisabled) {
                        handleActionSelect(action);
                      }
                    }}
                  >
                    <div class="flex gap-2">
                      <div class="size-9 flex items-center justify-center rounded-sm border bg-background">
                        <img
                          class="size-6 object-contain"
                          src={piece().logoUrl}
                          alt={piece().displayName}
                        />
                      </div>

                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-sm">
                            {action.displayName}
                          </span>

                          <Show when={isDisabled}>
                            <span class="text-xs text-muted-foreground">
                              {t('(Already added)')}
                            </span>
                          </Show>
                        </div>

                        <Show when={action.description}>
                          <div class="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {action.description}
                          </div>
                        </Show>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>

            <Show when={filteredActions().length === 0}>
              <div class="text-center text-muted-foreground py-8">
                {t('No actions found')}
              </div>
            </Show>
          </div>
        </ScrollArea>
      )}
    </Show>
  );
};
