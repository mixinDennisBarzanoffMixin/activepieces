import {
  apId,
  AppConnectionWithoutSensitiveData,
  isNil,
} from '@activepieces/shared';
import {
  ActivepiecesClientConnectionNameIsInvalid,
  ActivepiecesClientConnectionPieceNotFound,
  ActivepiecesClientEventName,
  ActivepiecesClientShowConnectionIframe,
  ActivepiecesNewConnectionDialogClosed,
  NEW_CONNECTION_QUERY_PARAMS,
} from 'ee-embed-sdk';
import { createEffect, createSignal, Show } from 'solid-js';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  CreateOrEditConnectionDialogContent,
  oauthAppsQueries,
} from '@/features/connections';
import { piecesHooks } from '@/features/pieces';
import { parentWindow } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

const extractIdFromQueryParams = () => {
  const connectionName = new URLSearchParams(window.location.search).get(
    NEW_CONNECTION_QUERY_PARAMS.connectionName,
  );
  return isNil(connectionName) || connectionName.length === 0
    ? apId()
    : connectionName;
};
export const EmbeddedConnectionDialog = () => {
  const connectionName = extractIdFromQueryParams();
  const params = new URLSearchParams(window.location.search);
  const pieceName = params.get(NEW_CONNECTION_QUERY_PARAMS.name);
  const randomId = params.get(NEW_CONNECTION_QUERY_PARAMS.randomId);
  return (
    <EmbeddedConnectionDialogContent
      connectionName={
        connectionName && connectionName.length > 0 ? connectionName : null
      }
      pieceName={pieceName}
      key={randomId}
    />
  );
};

type EmbeddedConnectionDialogContentProps = {
  pieceName: string | null;
  connectionName: string | null;
};

const EmbeddedConnectionDialogContent = (
  props: EmbeddedConnectionDialogContentProps,
) => {
  const [isDialogOpen, setIsDialogOpen] = createSignal(true);
  let hasErrorRef = false;

  const {
    data: pieceModel,
    isLoading: isLoadingPiece,
    isSuccess,
  } = piecesHooks.usePieceForEmbeddingConnection({
    pieceName: props.pieceName ?? '',
    connectionExternalId: props.connectionName ?? '',
  });
  const hideConnectionIframe = (
    connection?: Pick<AppConnectionWithoutSensitiveData, 'id' | 'externalId'>,
  ) => {
    postMessageToParent({
      type: ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED,
      data: {
        connection: connection
          ? {
              id: connection.id,
              name: connection.externalId,
            }
          : undefined,
      },
    });
  };

  const postMessageToParent = (
    event:
      | ActivepiecesNewConnectionDialogClosed
      | ActivepiecesClientConnectionNameIsInvalid
      | ActivepiecesClientConnectionPieceNotFound,
  ) => {
    parentWindow.postMessage(event, '*');
  };
  createEffect(() => {
    const showConnectionIframeEvent: ActivepiecesClientShowConnectionIframe = {
      type: ActivepiecesClientEventName.CLIENT_SHOW_CONNECTION_IFRAME,
      data: {},
    };
    parentWindow.postMessage(showConnectionIframeEvent, '*');
    document.body.style.background = 'transparent';
  });

  createEffect(() => {
    if (!isSuccess && !isLoadingPiece && !hasErrorRef) {
      postMessageToParent({
        type: ActivepiecesClientEventName.CLIENT_CONNECTION_PIECE_NOT_FOUND,
        data: {
          error: JSON.stringify({
            isValid: 'false',
            error: `piece: ${props.pieceName} not found`,
          }),
        },
      });
      hideConnectionIframe();
      hasErrorRef = true;
    }
  });

  const { data: piecesOAuth2AppsMap, isPending: loadingPiecesOAuth2AppsMap } =
    oauthAppsQueries.usePiecesOAuth2AppsMap();
  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          hideConnectionIframe();
        }
      }}
    >
      <DialogContent
        showOverlay={false}
        onInteractOutside={(event: Event) => event.preventDefault()}
        class={cn(
          'max-h-[70vh]  min-w-[450px] max-w-[450px] lg:min-w-[650px] lg:max-w-[650px] overflow-y-auto',
          {
            'bg-transparent! border-none! focus:outline-hidden border-transparent! shadow-none!':
              isLoadingPiece,
          },
        )}
        showCloseButton={!isLoadingPiece}
      >
        {isLoadingPiece ||
          (loadingPiecesOAuth2AppsMap && (
            <div class="flex justify-center items-center">
              <LoadingSpinner class="stroke-background size-[50px]" />
            </div>
          ))}

        <Show when={!isLoadingPiece && pieceModel && piecesOAuth2AppsMap}>
          <CreateOrEditConnectionDialogContent
            reconnectConnection={null}
            piecesOAuth2AppsMap={piecesOAuth2AppsMap}
            piece={pieceModel}
            externalIdComingFromSdk={props.connectionName}
            isGlobalConnection={false}
            setOpen={(open, connection) => {
              if (!open) {
                hideConnectionIframe(connection);
              }
              setIsDialogOpen(open);
            }}
          />
        </Show>
      </DialogContent>
    </Dialog>
  );
};
