import { ApFlagId, PieceSyncMode } from '@activepieces/shared';
import { RefreshCcw } from 'lucide-solid';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { platformPiecesMutations } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';

const SyncPiecesButton = () => {
  const { data: piecesSyncMode } = flagsHooks.useFlag<string>(
    ApFlagId.PIECES_SYNC_MODE,
  );
  const { mutate: syncPieces, isPending } =
    platformPiecesMutations.useSyncPieces();

  return (
    <>
      <Show when={piecesSyncMode === PieceSyncMode.OFFICIAL_AUTO}>
        <Button
          variant={'outline'}
          onClick={() => syncPieces()}
          loading={isPending}
          size={'sm'}
        >
          <RefreshCcw class="w-4 h-4 mr-2" /> Sync from Cloud
        </Button>
      </Show>
    </>
  );
};

SyncPiecesButton.displayName = 'SyncPiecesButton';
export { SyncPiecesButton };
