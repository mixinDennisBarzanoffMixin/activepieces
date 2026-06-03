import type { PieceMetadataModel } from '@activepieces/pieces-framework';
import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Check } from 'lucide-solid';
import { motion } from 'motion/react';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  type Accessor,
  untrack,
} from 'solid-js';

import { Button } from '@/components/ui/button';
import { CreateOrEditConnectionDialog } from '@/features/connections';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { authenticationSession } from '@/lib/authentication-session';

import { normalizePieceName } from '../lib/message-parsers';

export function ConnectionsRequiredCard(props: {
  connections: ConnectionRequiredData[];
  onSend?: (text: string) => void;
  projectId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [connectedSet, setConnectedSet] = createSignal<Set<string>>(new Set());
  const [existingConns, setExistingConns] = createSignal<
    Record<string, AppConnectionWithoutSensitiveData>
  >({});
  const [activeConnection, setActiveConnection] =
    createSignal<ConnectionRequiredData | null>(null);
  const [continued, setContinued] = createSignal(false);

  createEffect(() => {
    const projectId = props.projectId ?? authenticationSession.getProjectId();
    if (!projectId) return;
    const connections = props.connections;
    let cancelled = false;

    void Promise.all(
      connections.map(async (conn) => {
        const pieceName = normalizePieceName(conn.piece);
        const result = await appConnectionsApi.list({
          projectId,
          pieceName,
          limit: 1,
        });
        const connection = result.data.at(0);
        if (!connection) return;
        return { piece: conn.piece, connection };
      }),
    ).then((results) => {
      if (cancelled) return;
      const aiErrorPieces = new Set(
        connections
          .filter((conn) => conn.status === 'error')
          .map((conn) => conn.piece),
      );
      const found = results.filter((conn) => conn !== undefined);
      const map = Object.fromEntries(
        found.map((conn) => [conn.piece, conn.connection]),
      );
      const alreadyActive = new Set(
        found
          .filter(
            (conn) =>
              conn.connection.status === AppConnectionStatus.ACTIVE &&
              !aiErrorPieces.has(conn.piece),
          )
          .map((conn) => conn.piece),
      );
      setExistingConns(map);
      if (alreadyActive.size > 0) {
        setConnectedSet(alreadyActive);
      }
      if (alreadyActive.size === connections.length) {
        setContinued(true);
      }
    });

    return () => {
      cancelled = true;
    };
  });

  const allConnected = createMemo(() =>
    props.connections.every((c) => connectedSet().has(c.piece)),
  );

  function handleConnect(connection: ConnectionRequiredData) {
    setActiveConnection(connection);
  }

  return (
    <>
      <motion.div
        class="rounded-xl border bg-background overflow-hidden my-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        <For each={props.connections}>
          {(conn) => (
            <ConnectionRow
              key={conn.piece}
              connection={conn}
              isConnected={connectedSet().has(conn.piece)}
              existingConn={existingConns()[conn.piece] ?? null}
              onConnect={() => handleConnect(conn)}
            />
          )}
        </For>

        <Show when={allConnected()}>
          <div class="border-t px-4 py-3 bg-muted/30">
            <Show
              when={continued}
              fallback={
                props.onSend && (
                  <Button
                    size="sm"
                    class="gap-1.5"
                    onClick={() => {
                      setContinued(true);
                      props.onSend(
                        t('All connections are ready, continue building.'),
                      );
                    }}
                  >
                    <Check class="h-3.5 w-3.5" />
                    {t('Continue')}
                  </Button>
                )
              }
            >
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Check class="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                {t('All connected')}
              </div>
            </Show>
          </div>
        </Show>
      </motion.div>

      <Show when={activeConnection()}>
        {(connection) => (
          <ConnectionDialog
            connection={connection()}
            existingConn={existingConns()[connection().piece]}
            projectId={props.projectId}
            onClose={(created) => {
              if (created) {
                setConnectedSet((prev) => {
                  const next = new Set(prev);
                  next.add(connection().piece);
                  return next;
                });
                void queryClient.invalidateQueries({
                  queryKey: ['app-connections'],
                });
              }
              setActiveConnection(null);
            }}
          />
        )}
      </Show>
    </>
  );
}

function ConnectionDialog(props: {
  connection: ConnectionRequiredData;
  existingConn?: AppConnectionWithoutSensitiveData;
  projectId?: string | null;
  onClose: (created: boolean) => void;
}) {
  const piece = piecesHooks.usePiece({
    name: untrack(() => normalizePieceName(props.connection.piece)),
  });
  const model: Accessor<PieceMetadataModel | undefined> = piece.pieceModel;

  return (
    <Show when={model()}>
      {() => (
        <CreateOrEditConnectionDialog
          key={props.connection.piece}
          piece={model() as PieceMetadataModel}
          open={true}
          projectId={props.projectId}
          setOpen={(open, conn) => {
            if (open) return;
            props.onClose(Boolean(conn));
          }}
          reconnectConnection={props.existingConn ? props.existingConn : null}
          isGlobalConnection={false}
        />
      )}
    </Show>
  );
}

function ConnectionRow(props: {
  connection: ConnectionRequiredData;
  isConnected: boolean;
  existingConn: AppConnectionWithoutSensitiveData | null;
  onConnect: () => void;
}) {
  const pieceName = createMemo(() =>
    normalizePieceName(props.connection.piece),
  );
  const piece = piecesHooks.usePiece({ name: untrack(pieceName) });
  const isReconnect = createMemo(
    () =>
      props.existingConn !== null &&
      props.existingConn.status !== AppConnectionStatus.ACTIVE,
  );

  return (
    <div class="flex items-center gap-3 px-4 py-3 border-t first:border-t-0">
      <PieceIconWithPieceName
        pieceName={pieceName()}
        size="sm"
        border={false}
        showTooltip={false}
      />
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium">{props.connection.displayName}</div>
        <div class="text-xs text-muted-foreground">
          {props.isConnected
            ? t('Ready to use')
            : isReconnect()
            ? t('Your {name} connection is expired', {
                name: props.connection.displayName,
              })
            : t('Not connected')}
        </div>
      </div>
      <Show
        when={props.isConnected}
        fallback={
          <Button
            size="sm"
            variant="outline"
            class="gap-1.5 shrink-0"
            disabled={piece.isLoading}
            onClick={props.onConnect}
          >
            {isReconnect() ? t('Reconnect') : t('Connect')}
          </Button>
        }
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          class="shrink-0 flex items-center justify-center"
        >
          <Check class="h-5 w-5 text-green-600 dark:text-green-400" />
        </motion.span>
      </Show>
    </div>
  );
}

export type ConnectionRequiredData = {
  piece: string;
  displayName: string;
  status?: 'missing' | 'error';
};
