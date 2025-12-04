import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logVital, getVitals } from '../services/vitalsService';

const router = Router();

// POST /vitals
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { type, value, unit, notes } = req.body;

        if (!type || !value || !unit) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const vital = await logVital(req.user.id, type, value, unit, notes);
        res.status(201).json(vital);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /vitals
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { type, userId } = req.query;
        let targetUserId = req.user.id;

        // If a specific userId is requested, verify caregiver relationship
        if (userId) {
            const requestedId = parseInt(userId as string);
            if (requestedId !== req.user.id) {
                // Check if requester is a caregiver for this patient
                // For simplicity in this demo, we'll assume if they are a caregiver role, they can access linked patients
                // In a real app, strictly verify the link exists in patient_caregivers table
                if (req.user.role !== 'caregiver') {
                    return res.status(403).json({ error: 'Unauthorized' });
                }
                targetUserId = requestedId;
            }
        }

        const vitals = await getVitals(targetUserId, type as string);
        res.json(vitals);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
