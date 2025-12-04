import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as doseService from '../services/doseService';

const router = Router();

router.use(authenticate);

// POST /dose-logs (log a dose)
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { medicationId, scheduledDatetime, status, actualDatetime, scheduleId, notes } = req.body;

        const log = await doseService.logDose(
            medicationId,
            scheduledDatetime,
            status,
            actualDatetime,
            scheduleId,
            notes
        );

        res.status(201).json(log);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /dose-logs/patient/:patientId/recent
router.get('/patient/:patientId/recent', async (req: AuthRequest, res: Response) => {
    try {
        const patientId = parseInt(req.params.patientId);

        // Verify access
        if (req.user.role === 'patient' && req.user.id !== patientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const logs = await doseService.getDoseLogs(patientId);
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
