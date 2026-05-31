import { t } from 'i18next';
import { Eye, EyeOff, Pin, PinOff } from 'lucide-solid';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformPiecesMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

type PieceActionsProps = {
  pieceName: string;
  isEnabled: boolean;
};

const PieceActions = ({ pieceName, isEnabled }: PieceActionsProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const { mutate: togglePiece, isPending: isTogglePending } =
    platformPiecesMutations.useTogglePieceVisibility({
      platformId: platform.id,
      filteredPieceNames: platform.filteredPieceNames,
      refetch,
    });
  const { mutate: togglePin, isPending: isPinPending } =
    platformPiecesMutations.useTogglePiecePin({
      platformId: platform.id,
      pinnedPieces: platform.pinnedPieces,
      refetch,
    });

  const filtered = platform.filteredPieceNames.includes(pieceName);
  const pinned = platform.pinnedPieces.includes(pieceName);

  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={'sm'}
            loading={isTogglePending}
            disabled={!isEnabled}
            onClick={(e) => {
              if (!isEnabled) {
                e.preventDefault();
                return;
              }
              togglePiece(pieceName);
            }}
          >
            <Show when={filtered} fallback={<Eye class="size-4" />}>
              <EyeOff class="size-4" />
            </Show>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <Show
            when={filtered}
            fallback={t('Show this piece for all projects')}
          >
            t('Hide this piece from all projects'
          </Show>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={'sm'}
            loading={isPinPending}
            disabled={!isEnabled}
            onClick={(e) => {
              if (!isEnabled) {
                e.preventDefault();
                return;
              }
              togglePin(pieceName);
            }}
          >
            <Show when={pinned} fallback={<Pin class="size-4" />}>
              <PinOff class="size-4" />
            </Show>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <Show when={pinned} fallback={t('Pin this piece')}>
            t('Unpin this piece'
          </Show>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

PieceActions.displayName = 'PieceActions';

export { PieceActions };
