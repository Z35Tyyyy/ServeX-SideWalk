import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export const setupSocketIO = (io: SocketServer): void => {
    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        socket.on('kitchen:join', (token: string) => {
            try {
                jwt.verify(token, process.env.JWT_SECRET as string);
                socket.join('kitchen');
                socket.emit('kitchen:joined', { message: 'Joined kitchen room' });
            } catch (error) {
                socket.emit('error', { message: 'Authentication failed' });
            }
        });

        socket.on('kitchen:leave', () => { socket.leave('kitchen'); });

        socket.on('customer:join', ({ orderId }: { orderId: string }) => {
            socket.join(`order:${orderId}`);
            socket.emit('customer:joined', { orderId });
        });

        socket.on('customer:leave', ({ orderId }: { orderId: string }) => {
            socket.leave(`order:${orderId}`);
        });

        socket.on('disconnect', () => { console.log('Client disconnected:', socket.id); });
    });
};
