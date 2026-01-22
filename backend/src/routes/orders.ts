import { Router, Request, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import { Order, MenuItem, Table, TableSession } from '../models/index.js';
import { protect, authorize, orderLimiter } from '../middleware/index.js';

const router = Router();
let io: SocketServer;

export const setOrdersIO = (socketIO: SocketServer) => { io = socketIO; };

const TAX_RATE = 0.05;
const SERVICE_CHARGE_RATE = 0.05;

// In-memory rate limiting per table (simple approach)
const tableAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const checkTableRateLimit = (tableId: string): boolean => {
    const now = Date.now();
    const record = tableAttempts.get(tableId);

    if (!record || now > record.resetAt) {
        tableAttempts.set(tableId, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }

    if (record.count >= MAX_ATTEMPTS) {
        return false;
    }

    record.count++;
    return true;
};

// Create order (customer)
router.post('/', orderLimiter, async (req: Request, res: Response) => {
    try {
        const { tableId, items, sessionToken, customerName, customerPhone } = req.body;

        // 1. Validate table exists and is active
        const table = await Table.findById(tableId);
        if (!table || !table.isActive) {
            return res.status(400).json({ message: 'Invalid or inactive table' });
        }

        // 2. Validate session token (QR replay protection)
        if (!sessionToken) {
            return res.status(401).json({ message: 'Session token required. Please scan QR code again.' });
        }

        const session = await TableSession.findOne({
            tableId,
            sessionToken,
            status: 'ACTIVE',
            expiresAt: { $gt: new Date() },
        });

        if (!session) {
            return res.status(401).json({ message: 'Session expired or invalid. Please scan QR code again.' });
        }

        // 3. Rate limiting per table
        if (!checkTableRateLimit(tableId)) {
            return res.status(429).json({ message: 'Too many order attempts. Please wait before trying again.' });
        }

        // 4. Check for existing unpaid order (one unpaid order per table rule)
        const existingUnpaidOrder = await Order.findOne({
            tableId,
            status: 'CREATED',
        });

        if (existingUnpaidOrder) {
            return res.status(400).json({
                message: 'You have a pending order. Please complete payment first.',
                orderId: existingUnpaidOrder._id,
            });
        }

        // 5. Validate items exist and are available
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Order must have at least one item' });
        }

        const menuItemIds = items.map((i: any) => i.menuItemId);
        const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, isAvailable: true });

        if (menuItems.length !== items.length) {
            return res.status(400).json({ message: 'Some items are unavailable or invalid' });
        }

        // 6. SERVER-SIDE PRICE CALCULATION (CRITICAL - never trust frontend)
        const orderItems = items.map((item: any) => {
            const menuItem = menuItems.find((m) => m._id.toString() === item.menuItemId);
            if (!menuItem) throw new Error('Menu item not found');
            return {
                menuItemId: item.menuItemId,
                name: menuItem.name,
                quantity: Math.max(1, Math.min(99, parseInt(item.quantity) || 1)), // Sanitize quantity
                price: menuItem.price, // Use server price, NOT frontend
                specialInstructions: (item.specialInstructions || '').substring(0, 500), // Limit length
            };
        });

        const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
        const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
        const serviceCharge = Math.round(subtotal * SERVICE_CHARGE_RATE * 100) / 100;
        const totalAmount = Math.round((subtotal + tax + serviceCharge) * 100) / 100;

        // 7. Create order with session reference
        const order = await Order.create({
            tableId,
            items: orderItems,
            subtotal,
            tax,
            serviceCharge,
            totalAmount,
            sessionId: session.sessionToken, // Link to session for tracking
            customerName: (customerName || '').substring(0, 100),
            customerPhone: (customerPhone || '').substring(0, 20),
            status: 'CREATED', // Will only go to kitchen after PAID
        });

        // Extend session on activity
        session.lastActivityAt = new Date();
        session.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await session.save();

        res.status(201).json({ order, message: 'Order created. Proceed to payment.' });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get kitchen active orders (staff)
router.get('/kitchen/active', protect, authorize('admin', 'kitchen'), async (req: Request, res: Response) => {
    try {
        // Only show PAID or later orders (not CREATED - those haven't paid yet)
        const orders = await Order.find({
            status: { $in: ['PAID', 'PREPARING', 'READY'] }
        }).populate('tableId', 'tableNumber').sort({ createdAt: 1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single order (for payment/tracking)
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id).populate('tableId', 'tableNumber');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update order status (staff only)
router.patch('/:id/status', protect, authorize('admin', 'kitchen'), async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const validStatuses = ['PAID', 'PREPARING', 'READY', 'SERVED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('tableId', 'tableNumber');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Emit real-time update
        if (io) {
            io.to('kitchen').emit('order:statusUpdate', { orderId: order._id, status });
            io.to(`order:${order._id}`).emit('order:statusUpdate', { orderId: order._id, status });
        }

        // If served, complete the table session
        if (status === 'SERVED' && order.tableId) {
            await TableSession.updateMany(
                { tableId: order.tableId, status: 'ACTIVE' },
                { status: 'COMPLETED' }
            );
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all orders (admin)
router.get('/', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query: any = {};
        if (status) query.status = status;
        const orders = await Order.find(query).populate('tableId', 'tableNumber').sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
        const total = await Order.countDocuments(query);
        res.json({ orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Analytics summary (admin)
router.get('/analytics/summary', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const result = await Order.aggregate([
            { $match: { status: { $in: ['PAID', 'PREPARING', 'READY', 'SERVED'] } } },
            { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } }
        ]);
        const summary = result[0] || { totalOrders: 0, totalRevenue: 0 };
        summary.avgOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0;
        const topItems = await Order.aggregate([
            { $match: { status: { $in: ['PAID', 'PREPARING', 'READY', 'SERVED'] } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.menuItemId', name: { $first: '$items.name' }, totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);
        res.json({ summary, topItems });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
