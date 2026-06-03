import type { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import type { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { createSignal, Show, type JSX } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreateOrEditConnectionDialog } from '@/features/connections';
import { piecesHooks } from '@/features/pieces';

type NewConnectionDialogProps = {
  onConnectionCreated: (connection: AppConnectionWithoutSensitiveData) => void;
  children: JSX.Element;
  isGlobalConnection: boolean;
};

const NewConnectionDialog = (props: NewConnectionDialogProps) => {
  const [dialogTypesOpen, setDialogTypesOpen] = createSignal(false);
  const [connectionDialogOpen, setConnectionDialogOpen] = createSignal(false);
  const [selectedPiece, setSelectedPiece] = createSignal<
    PieceMetadataModelSummary | undefined
  >(undefined);
  const { pieces, isLoading } = piecesHooks.usePieces({});
  const [searchTerm, setSearchTerm] = createSignal('');

  const filteredPieces = pieces?.filter((piece) => {
    return (
      !isNil(piece.auth) &&
      piece.displayName.toLowerCase().includes(searchTerm().toLowerCase())
    );
  });

  const clickPiece = (name: string) => {
    setDialogTypesOpen(false);
    setSelectedPiece(pieces?.find((piece) => piece.name === name));
    setConnectionDialogOpen(true);
  };

  return (
    <>
      <Show when={selectedPiece()}>
        {(piece) => (
          <CreateOrEditConnectionDialog
            reconnectConnection={null}
            piece={piece()}
            open={connectionDialogOpen}
            isGlobalConnection={props.isGlobalConnection}
            key={`CreateOrEditConnectionDialog-open-${connectionDialogOpen()}`}
            setOpen={(open, connection) => {
              setConnectionDialogOpen(open);
              if (connection) {
                props.onConnectionCreated(connection);
              }
            }}
          />
        )}
      </Show>
      <Dialog
        open={dialogTypesOpen}
        onOpenChange={(open) => {
          setDialogTypesOpen(open);
          setSearchTerm('');
        }}
      >
        <DialogTrigger asChild>{props.children}</DialogTrigger>
        <DialogContent class="min-w-[700px] max-w-[700px] h-[680px] max-h-[680px] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('New Connection')}</DialogTitle>
          </DialogHeader>
          <div class="mb-4">
            <Input
              placeholder={t('Search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
            />
          </div>
          <ScrollArea class="grow overflow-y-auto ">
            <div class="grid grid-cols-4 gap-4">
              <Show
                when={
                  isLoading || (filteredPieces && filteredPieces.length === 0)
                }
              >
                <div class="text-center">{t('No pieces found')}</div>
              </Show>
              {!isLoading &&
                filteredPieces &&
                filteredPieces.map((piece) => (
                  <div
                    onClick={() => clickPiece(piece.name)}
                    class="border p-2 h-[150px] w-[150px] flex flex-col items-center justify-center hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-lg"
                  >
                    <img class="w-[40px] h-[40px]" src={piece.logoUrl} />
                    <div class="mt-2 text-center text-md">
                      {piece.displayName}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t('Close')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { NewConnectionDialog };
