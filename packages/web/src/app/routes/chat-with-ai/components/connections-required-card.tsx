import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Check } from 'lucide-solid';
import { motion } from 'motion/react';
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { authenticationSession } from '@/lib/authentication-session';

import { normalizePieceName } from '../lib/message-parsers';

export function ConnectionsRequiredCard({
  connections,
  onSend,
  projectId: selectedProjectId,
}: {
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

  const activePieceName = activeConnection
    ? normalizePieceName(activeConnection.piece)
    : null;
  const { pieceModel } = piecesHooks.usePiece({
    name: activePieceName ?? '',
    enabled: !!activePieceName,
  });

  const connectionsKey = createMemo(() =>
    connections.map((c) => c.piece).join(','),
  );

  createEffect(() => {
    const projectId = selectedProjectId ?? authenticationSession.getProjectId();
    if (!projectId) return;
    let cancelled = false;

    void Promise.all(
      connections.map(async (conn) => {
        const pieceName = normalizePieceName(conn.piece);
        const result = await appConnectionsApi.list({
          projectId,
          pieceName,
          limit: 1,
        });
        return { piece: conn.piece, connection: result.data[0] ?? null };
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, AppConnectionWithoutSensitiveData> = {};
      const alreadyActive = new Set<string>();
      const aiErrorPieces = new Set(
        connections.filter((c) => c.status === 'error').map((c) => c.piece),
      );
      for (const { piece, connection } of results) {
        if (connection) {
          map[piece] = connection;
          if (
            connection.status === AppConnectionStatus.ACTIVE &&
            !aiErrorPieces.has(piece)
          ) {
            alreadyActive.add(piece);
          }
        }
      }
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

  const allConnected = connections.every((c) => connectedSet.has(c.piece));

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
        <For each={connections}>
          {(conn) => (
            <ConnectionRow
              key={conn.piece}
              connection={conn}
              isConnected={connectedSet.has(conn.piece)}
              existingConn={existingConns[conn.piece] ?? null}
              onConnect={() => handleConnect(conn)}
            />
          )}
        </For>

        <Show when={allConnected}>
          <div className="border-t px-4 py-3 bg-muted/30">
            <Show
              when={continued}
              fallback={
                onSend && (
                  <Button
                    size="sm"
                    class="gap-1.5"
                    onClick={() => {
                      setContinued(true);
                      onSend(
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check class="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                {t('All connected')}
              </div>
            </Show>
          </div>
        </Show>
      </motion.div>

      <Show when={pieceModel && activeConnection}>
        <CreateOrEditConnectionDialog
          key={activeConnection.piece}
          piece={pieceModel}
          open={true}
          projectId={selectedProjectId}
          setOpen={(open, createdConnection) => {
            if (!open) {
              if (createdConnection) {
                setConnectedSet((prev) => {
                  const next = new Set(prev);
                  next.add(activeConnection.piece);
                  return next;
                });
                void queryClient.invalidateQueries({
                  queryKey: ['app-connections'],
                });
              }
              setActiveConnection(null);
            }
          }}
          reconnectConnection={existingConns[activeConnection.piece] ?? null}
          isGlobalConnection={false}
        />
      </Show>
    </>
  );
}

function ConnectionRow({
  connection,
  isConnected,
  existingConn,
  onConnect,
}: {
  connection: ConnectionRequiredData;
  isConnected: boolean;
  existingConn: AppConnectionWithoutSensitiveData | null;
  onConnect: () => void;
}) {
  const pieceName = normalizePieceName(connection.piece);
  const { isLoading } = piecesHooks.usePiece({ name: pieceName });
  const isReconnect =
    existingConn !== null && existingConn.status !== AppConnectionStatus.ACTIVE;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t first:border-t-0">
      <PieceIconWithPieceName
        pieceName={pieceName}
        size="sm"
        border={false}
        showTooltip={false}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{connection.displayName}</div>
        <div className="text-xs text-muted-foreground">
          {isConnected
            ? t('Ready to use')
            : isReconnect
            ? t('Your {name} connection is expired', {
                name: connection.displayName,
              })
            : t('Not connected')}
        </div>
      </div>
      <Show
        when={isConnected}
        fallback={
          <Button
            size="sm"
            variant="outline"
            class="gap-1.5 shrink-0"
            disabled={isLoading}
            onClick={onConnect}
          >
            {isReconnect ? t('Reconnect') : t('Connect')}
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
