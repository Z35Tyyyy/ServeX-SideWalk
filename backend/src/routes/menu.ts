import { Router, Request, Response } from 'express';
import { MenuItem } from '../models/index.js';
import { protect, authorize } from '../middleware/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const { category } = req.query;
        const query: any = { isAvailable: true };
        if (category) query.category = category;
        const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/categories', async (req: Request, res: Response) => {
    try {
        const categories = await MenuItem.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const item = await MenuItem.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.patch('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.patch('/:id/availability', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        item.isAvailable = !item.isAvailable;
        await item.save();
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
