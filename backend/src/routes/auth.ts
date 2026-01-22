import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/index.js';
import { protect, authorize, generateToken, validate, authLimiter } from '../middleware/index.js';

const router = Router();

const loginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(6) }) });

router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!user.isActive) return res.status(401).json({ message: 'Account deactivated' });
        const token = generateToken(user._id.toString());
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/me', protect, (req: Request, res: Response) => {
    const user = req.user!;
    res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
});

router.post('/register', protect, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const { email, password, name, role } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'User already exists' });
        const user = await User.create({ email, password, name, role });
        res.status(201).json({ id: user._id, email: user.email, name: user.name, role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
