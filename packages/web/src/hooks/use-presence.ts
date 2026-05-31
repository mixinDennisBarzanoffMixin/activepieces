import {
  PresenceUpdatedEvent,
  PresenceUser,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { createEffect, createSignal, onCleanup } from 'solid-js';

import { useSocket } from '@/components/providers/socket-provider';
import { authenticationSession } from '@/lib/authentication-session';

function usePresence({ resourceId }: { resourceId: string }) {
  const socket = useSocket();
  const currentUserId = authenticationSession.getCurrentUserId();
  const [activeUsers, setActiveUsers] = createSignal<PresenceUser[]>([]);

  createEffect(() => {
    const handlePresenceUpdated = (event: PresenceUpdatedEvent) => {
      if (event.resourceId === resourceId) {
        setActiveUsers(event.users.filter((u) => u.userId !== currentUserId));
      }
    };

    socket.on(WebsocketClientEvent.PRESENCE_UPDATED, handlePresenceUpdated);

    onCleanup(() => {
      socket.off(WebsocketClientEvent.PRESENCE_UPDATED, handlePresenceUpdated);
    });
  });

  createEffect(() => {
    socket.emit(
      WebsocketServerEvent.JOIN_PRESENCE,
      { resourceId },
      (response: { users: PresenceUser[] }) => {
        setActiveUsers(
          response.users.filter((u) => u.userId !== currentUserId),
        );
      },
    );

    const heartbeat = setInterval(() => {
      socket.emit(WebsocketServerEvent.JOIN_PRESENCE, { resourceId });
    }, 30_000);

    onCleanup(() => {
      clearInterval(heartbeat);
      socket.emit(WebsocketServerEvent.LEAVE_PRESENCE, { resourceId });
    });
  });

  return activeUsers;
}

export { usePresence };
