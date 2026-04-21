import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export const useSocket = (matchId, onScoreUpdate) => {
  const cbRef = useRef(onScoreUpdate);
  cbRef.current = onScoreUpdate;

  useEffect(() => {
    if (!matchId) return;

    socket = io(import.meta.env.VITE_SERVER_URL || '', { transports: ['websocket'] });

    socket.emit('match:join', { matchId });

    socket.on('match:scoreUpdate', (data) => cbRef.current?.(data));
    socket.on('match:undo', (data) => cbRef.current?.(data));
    socket.on('match:completed', (data) => cbRef.current?.(data));

    return () => {
      socket?.emit('match:leave', { matchId });
      socket?.disconnect();
      socket = null;
    };
  }, [matchId]);

  return socket;
};

export const emitScoreUpdate = (matchId, liveScore) => {
  socket?.emit('match:adminUpdate', { matchId, liveScore });
};
