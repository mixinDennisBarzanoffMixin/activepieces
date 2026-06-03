import {
  AppConnectionScope,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { RefreshCw } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CreateOrEditConnectionDialog } from '@/features/connections';
import { piecesHooks } from '@/features/pieces';

type ReconnectButtonDialogProps = {
  connection: AppConnectionWithoutSensitiveData;
  onConnectionCreated: () => void;
  hasPermission: boolean;
};

const ReconnectButtonDialog = (props: ReconnectButtonDialogProps) => {
  const [open, setOpen] = createSignal(false);
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: props.connection.pieceName,
    version: props.connection.pieceVersion,
    enabled: open,
  });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            disabled={!props.hasPermission}
            variant={'ghost'}
          >
            <RefreshCw class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <Show when={!props.hasPermission} fallback={<p>{t('Reconnect')}</p>}>
            <p>{t('Permission needed')}</p>
          </Show>
        </TooltipContent>
      </Tooltip>
      <Show when={open && !isLoading && pieceModel}>
        <CreateOrEditConnectionDialog
          reconnectConnection={props.connection}
          isGlobalConnection={
            props.connection.scope === AppConnectionScope.PLATFORM
          }
          piece={pieceModel}
          open={open}
          key={`CreateOrEditConnectionDialog-open-${open()}`}
          setOpen={(open, connection) => {
            setOpen(open);
            if (connection) {
              props.onConnectionCreated();
            }
          }}
        />
      </Show>
    </>
  );
};

export { ReconnectButtonDialog };
