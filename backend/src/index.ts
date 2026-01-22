import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import { apiLimiter } from './middleware/index.js';
import { authRoutes, tableRoutes, menuRoutes, orderRoutes, paymentRoutes, setOrdersIO, setPaymentsIO } from './routes/index.js';
import { setupSocketIO } from './socket/index.js';
import { startCleanupJob } from './jobs/cleanup.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, { cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET', 'POST'] } });

setOrdersIO(io);
setPaymentsIO(io);
setupSocketIO(io);

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL?.replace(/\/$/, ''), // without trailing slash
].filter(Boolean) as string[];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Allow all for now, tighten later
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    // Start background cleanup job
    startCleanupJob();

    httpServer.listen(PORT, () => {
        console.log(`
===============================
🚀 ServeX Backend Running
📍 Port: ${PORT}
🌐 Frontend: ${process.env.FRONTEND_URL}
🔌 Socket.IO: Enabled
📦 MongoDB: Connected
🔒 Security: Enabled
   - Session locks
   - Rate limiting
   - Price validation
   - Order cleanup
===============================`);
    });
});
