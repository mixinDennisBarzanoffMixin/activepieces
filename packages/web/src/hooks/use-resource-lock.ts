import {
  ResourceLockedEvent,
  ResourceUnlockedEvent,
  LockResourceResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { createEffect, createSignal, onCleanup } from 'solid-js';

import { useSocket } from '@/components/providers/socket-provider';
import { authenticationSession } from '@/lib/authentication-session';

function useResourceLock({ resourceId }: UseResourceLockParams) {
  const socket = useSocket();
  const currentUserId = authenticationSession.getCurrentUserId();
  let isOwner = false;
  const [lockedBy, setLockedBy] = createSignal<{
    userId: string;
    userDisplayName: string;
  } | null>(null);

  createEffect(() => {
    const handleLocked = (event: ResourceLockedEvent) => {
      if (event.resourceId === resourceId && event.userId !== currentUserId) {
        setLockedBy({
          userId: event.userId,
          userDisplayName: event.userDisplayName,
        });
      }
    };
    const handleUnlocked = (event: ResourceUnlockedEvent) => {
      if (event.resourceId === resourceId) {
        setLockedBy(null);
      }
    };

    socket.on(WebsocketClientEvent.RESOURCE_LOCKED, handleLocked);
    socket.on(WebsocketClientEvent.RESOURCE_UNLOCKED, handleUnlocked);

    onCleanup(() => {
      socket.off(WebsocketClientEvent.RESOURCE_LOCKED, handleLocked);
      socket.off(WebsocketClientEvent.RESOURCE_UNLOCKED, handleUnlocked);
    });
  });

  createEffect(() => {
    socket.emit(
      WebsocketServerEvent.LOCK_RESOURCE,
      { resourceId },
      (response: LockResourceResponse) => {
        if (response.acquired) {
          isOwner = true;
        } else if (response.lock) {
          setLockedBy(response.lock);
        }
      },
    );

    const heartbeat = setInterval(() => {
      if (!isOwner) {
        return;
      }
      socket.emit(
        WebsocketServerEvent.LOCK_RESOURCE,
        { resourceId },
        (response: LockResourceResponse) => {
          if (!response.acquired && response.lock) {
            isOwner = false;
            setLockedBy(response.lock);
          }
        },
      );
    }, 30_000);

    onCleanup(() => {
      clearInterval(heartbeat);
      if (isOwner) {
        socket.emit(WebsocketServerEvent.UNLOCK_RESOURCE, { resourceId });
        isOwner = false;
      }
    });
  });

  const takeOver = () => {
    socket.emit(
      WebsocketServerEvent.LOCK_RESOURCE,
      { resourceId, force: true },
      (response: LockResourceResponse) => {
        if (response.acquired) {
          isOwner = false;
          window.location.reload();
        }
      },
    );
  };

  return { lockedBy, takeOver };
}

export { useResourceLock };

type UseResourceLockParams = {
  resourceId: string;
};
