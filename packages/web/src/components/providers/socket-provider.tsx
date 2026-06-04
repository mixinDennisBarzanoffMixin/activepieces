import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

import { apiBaseUrl } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

function socketTarget() {
  const base = apiBaseUrl().replace(/\/+$/, '');
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return { url: base, path: '/api/socket.io' };
  }
  return {
    url: window.location.origin,
    path: `${base}/api/socket.io`,
  };
}

const target = socketTarget();
console.log('[veritly-ap-socket] target', target);
const socket = io(target.url, {
  transports: ['websocket'],
  path: target.path,
  autoConnect: false,
  reconnection: true,
});

const SocketContext = React.createContext<typeof socket>(socket);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const token = authenticationSession.getToken();
  const projectId = authenticationSession.getProjectId();
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (token) {
      socket.auth = { token, projectId };
      console.log('[veritly-ap-socket] auth', {
        hasToken: true,
        projectId,
        connected: socket.connected,
      });
      if (!socket.connected) {
        socket.connect();

        socket.on('connect', () => {
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
          }
          console.log('[veritly-ap-socket] connected', socket.id);
        });

        socket.on('connect_error', (err) => {
          console.error('[veritly-ap-socket] connect_error', {
            message: err.message,
            path: target.path,
            url: target.url,
          });
        });

        socket.on('disconnect', (reason) => {
          console.log('[veritly-ap-socket] disconnect', reason);
          if (!toastIdRef.current) {
            const id = toast('Connection Lost', {
              id: 'websocket-disconnected',
              description: 'We are trying to reconnect...',
              duration: Infinity,
            });
            toastIdRef.current = id?.toString() ?? null;
          }
          if (reason === 'io server disconnect') {
            socket.connect();
          }
        });
      }
    } else {
      socket.disconnect();
    }
    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [token, projectId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);
