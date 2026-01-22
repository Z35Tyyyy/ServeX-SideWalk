import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Table, TableSession, generateSessionToken } from '../models/index.js';
import { protect, authorize, validate } from '../middleware/index.js';
import { generateTableQRCode } from '../services/index.js';

const router = Router();

const createTableSchema = z.object({ body: z.object({ tableNumber: z.number().int().positive(), capacity: z.number().int().positive().optional() }) });

// Get all tables (admin)
router.get('/', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const tables = await Table.find().sort({ tableNumber: 1 });
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Validate table and create session (customer QR scan)
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) return res.status(404).json({ message: 'Table not found' });
        if (!table.isActive) return res.status(400).json({ message: 'Table is currently inactive' });

        // Create/refresh session for this table using upsert to avoid duplicate key issues
        const SESSION_DURATION_MINS = 30;
        const sessionToken = generateSessionToken();

        // Use findOneAndUpdate with upsert to handle existing sessions gracefully
        const session = await TableSession.findOneAndUpdate(
            { tableId: table._id },
            {
                $set: {
                    sessionToken,
                    status: 'ACTIVE',
                    expiresAt: new Date(Date.now() + SESSION_DURATION_MINS * 60 * 1000),
                    lastActivityAt: new Date(),
                }
            },
            { upsert: true, new: true }
        );

        res.json({
            id: table._id,
            tableNumber: table.tableNumber,
            isActive: table.isActive,
            capacity: table.capacity,
            sessionToken: session.sessionToken,
        });
    } catch (error) {
        console.error('Table validation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Validate session middleware for customer endpoints
router.post('/:id/validate-session', async (req: Request, res: Response) => {
    try {
        const { sessionToken } = req.body;
        if (!sessionToken) return res.status(400).json({ message: 'Session token required' });

        const session = await TableSession.findOne({
            tableId: req.params.id,
            sessionToken,
            status: 'ACTIVE',
            expiresAt: { $gt: new Date() },
        });

        if (!session) return res.status(401).json({ message: 'Session expired. Please scan QR again.' });

        // Extend session
        session.lastActivityAt = new Date();
        session.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await session.save();

        res.json({ valid: true, expiresAt: session.expiresAt });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create table (admin)
router.post('/', protect, authorize('admin'), validate(createTableSchema), async (req: Request, res: Response) => {
    try {
        const { tableNumber, capacity } = req.body;
        const exists = await Table.findOne({ tableNumber });
        if (exists) return res.status(400).json({ message: 'Table number already exists' });
        const tempTable = await Table.create({ tableNumber, capacity, qrCodeUrl: '', qrCodeData: '' });
        const { url, data } = await generateTableQRCode(tempTable._id.toString());
        tempTable.qrCodeUrl = url;
        tempTable.qrCodeData = data;
        await tempTable.save();
        res.status(201).json(tempTable);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update table (admin)
router.patch('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!table) return res.status(404).json({ message: 'Table not found' });
        res.json(table);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete table (admin)
router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const table = await Table.findByIdAndDelete(req.params.id);
        if (!table) return res.status(404).json({ message: 'Table not found' });
        // Also clean up sessions
        await TableSession.deleteMany({ tableId: req.params.id });
        res.json({ message: 'Table deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Regenerate QR (admin)
router.post('/:id/regenerate-qr', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) return res.status(404).json({ message: 'Table not found' });
        const { url, data } = await generateTableQRCode(table._id.toString());
        table.qrCodeUrl = url;
        table.qrCodeData = data;
        await table.save();
        // Invalidate all sessions when QR regenerated (security)
        await TableSession.updateMany({ tableId: table._id }, { status: 'EXPIRED' });
        res.json({ qrCodeUrl: table.qrCodeUrl, qrCodeData: table.qrCodeData });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
