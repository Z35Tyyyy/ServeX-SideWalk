import { Order, TableSession } from '../models/index.js';

// Cleanup abandoned orders and expired sessions
export const startCleanupJob = (): void => {
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const ORDER_TIMEOUT = 15 * 60 * 1000; // 15 minutes for unpaid orders

    const runCleanup = async () => {
        try {
            const now = new Date();

            // 1. Expire old sessions
            const expiredSessions = await TableSession.updateMany(
                { status: 'ACTIVE', expiresAt: { $lt: now } },
                { status: 'EXPIRED' }
            );

            if (expiredSessions.modifiedCount > 0) {
                console.log(`🧹 Expired ${expiredSessions.modifiedCount} inactive sessions`);
            }

            // 2. Cancel abandoned unpaid orders (older than 15 minutes)
            const abandonedCutoff = new Date(now.getTime() - ORDER_TIMEOUT);
            const cancelledOrders = await Order.updateMany(
                { status: 'CREATED', createdAt: { $lt: abandonedCutoff } },
                { status: 'CANCELLED' }
            );

            if (cancelledOrders.modifiedCount > 0) {
                console.log(`🧹 Cancelled ${cancelledOrders.modifiedCount} abandoned orders`);
            }

        } catch (error) {
            console.error('Cleanup job error:', error);
        }
    };

    // Run immediately on startup
    runCleanup();

    // Then run every 5 minutes
    setInterval(runCleanup, CLEANUP_INTERVAL);

    console.log('🧹 Cleanup job started (runs every 5 minutes)');
};
