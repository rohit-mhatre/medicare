import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendSOSNotification, getNotifications, markAsRead } from '../services/notificationService';

const router = Router();

// POST /notifications/sos
router.post('/sos', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { latitude, longitude } = req.body;
        await sendSOSNotification(req.user.id, latitude, longitude);
        res.json({ message: 'SOS sent successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await getNotifications(req.user.id);
        res.json(notifications);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /notifications/:id/read
router.post('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await markAsRead(parseInt(req.params.id), req.user.id);
        res.json({ message: 'Marked as read' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
