import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export const getSocket = (): Socket => {
    if (!socket) socket = io(SOCKET_URL, { autoConnect: false, transports: ['websocket', 'polling'] });
    return socket;
};

export const connectSocket = () => { const s = getSocket(); if (!s.connected) s.connect(); };
export const disconnectSocket = () => { if (socket?.connected) socket.disconnect(); };
export const joinKitchen = (token: string) => { getSocket().emit('kitchen:join', token); };
export const leaveKitchen = () => { getSocket().emit('kitchen:leave'); };
export const joinOrderTracking = (orderId: string) => { getSocket().emit('customer:join', { orderId }); };
export const leaveOrderTracking = (orderId: string) => { getSocket().emit('customer:leave', { orderId }); };
