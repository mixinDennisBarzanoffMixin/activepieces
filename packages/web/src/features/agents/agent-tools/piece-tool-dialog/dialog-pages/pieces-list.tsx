import { t } from 'i18next';
import { Search } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { PieceStepMetadataWithSuggestions } from '@/features/pieces/types';

import { usePieceToolsDialogStore } from '../../stores/pieces-tools';

interface PiecesContentProps {
  isPiecesLoading: boolean;
  pieceMetadata: PieceStepMetadataWithSuggestions[];
}

export const PiecesList = (props: PiecesContentProps) => {
  const { searchQuery, setSearchQuery, handlePieceSelect } =
    usePieceToolsDialogStore();
  return (
    <div class="flex flex-col h-full">
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

      <ScrollArea class="flex-1 min-h-0 px-4 py-2">
        <Show
          when={props.isPiecesLoading}
          fallback={
            !props.isPiecesLoading && props.pieceMetadata.length === 0 ? (
              <div class="h-full flex items-center py-2 justify-center text-muted-foreground">
                {t('No pieces found')}
              </div>
            ) : (
              <div class="grid grid-cols-3 gap-4">
                <For each={props.pieceMetadata}>
                  {(piece) => (
                    <div
                      onClick={() => handlePieceSelect(piece)}
                      class="p-2 flex items-center gap-x-2 hover:bg-accent cursor-pointer rounded-lg"
                    >
                      <div class="size-9 flex items-center justify-center rounded-sm aspect-square border bg-background">
                        <img
                          class="size-6 rounded object-contain"
                          src={piece.logoUrl}
                          alt={piece.displayName}
                        />
                      </div>

                      <p class="font-semibold text-sm">{piece.displayName}</p>
                    </div>
                  )}
                </For>
              </div>
            )
          }
        >
          <div class="grid grid-cols-3 gap-4">
            <For each={Array.from({ length: 22 })}>
              {() => <Skeleton class="h-12 w-full rounded-lg" />}
            </For>
          </div>
        </Show>
      </ScrollArea>
    </div>
  );
};
