import { io } from 'socket.io-client';
import { createEffect, createContext, useContext, onCleanup, JSX } from 'solid-js';
import { toast } from 'solid-sonner';

import { API_BASE_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  path: '/api/socket.io',
  autoConnect: false,
  reconnection: true,
});

const SocketContext = createContext<typeof socket>(socket);

export const SocketProvider = ({ children }: { children: JSX.Element }) => {
  const token = authenticationSession.getToken();
  const projectId = authenticationSession.getProjectId();
  let toastId: string | null = null;

  createEffect(() => {
    if (token) {
      socket.auth = { token, projectId };
      if (!socket.connected) {
        socket.connect();

        socket.on('connect', () => {
          if (toastId) {
            toast.dismiss(toastId);
            toastId = null;
          }
          console.log('connected to socket');
        });

        socket.on('disconnect', (reason) => {
          if (!toastId) {
            const id = toast('Connection Lost', {
              id: 'websocket-disconnected',
              description: 'We are trying to reconnect...',
              duration: Infinity,
            });
            toastId = id ? id.toString() : null;
          }
          if (reason === 'io server disconnect') {
            socket.connect();
          }
        });
      }
    } else {
      socket.disconnect();
    }
    onCleanup(() => {
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
    });
  });

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
