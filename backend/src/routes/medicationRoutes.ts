import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as medicationService from '../services/medicationService';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET / (get medications for self or linked patient)
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.query;
        let targetUserId = req.user.id;

        if (userId) {
            const requestedId = parseInt(userId as string);
            if (requestedId !== req.user.id) {
                if (req.user.role !== 'caregiver') {
                    return res.status(403).json({ error: 'Unauthorized' });
                }
                // In a real app, verify patient_caregivers link here
                targetUserId = requestedId;
            }
        }

        const medications = await medicationService.getMedicationsByPatient(targetUserId);
        res.json(medications);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /medications (create medication)
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { patientId, name, dosage, frequency, instructions, startDate, endDate, currentSupply, refillThreshold } = req.body;

        // Verify user has access to this patient
        if (req.user.role === 'patient' && req.user.id !== patientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const medication = await medicationService.createMedication(
            patientId,
            name,
            dosage,
            frequency,
            instructions,
            startDate,
            endDate,
            currentSupply,
            refillThreshold
        );

        res.status(201).json(medication);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /medications/patient/:patientId (get all medications for patient)
router.get('/patient/:patientId', async (req: AuthRequest, res: Response) => {
    try {
        const patientId = parseInt(req.params.patientId);

        // Verify access
        if (req.user.role === 'patient' && req.user.id !== patientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const medications = await medicationService.getMedicationsByPatient(patientId);
        res.json(medications);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /medications/:id (update medication)
router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        const medication = await medicationService.updateMedication(id, updates);
        res.json(medication);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /medications/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await medicationService.deleteMedication(id);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /medications/:id/schedule (add schedule)
router.post('/:id/schedule', async (req: AuthRequest, res: Response) => {
    try {
        const medicationId = parseInt(req.params.id);
        const { scheduledTime, daysOfWeek } = req.body;

        const schedule = await medicationService.addMedicationSchedule(
            medicationId,
            scheduledTime,
            daysOfWeek
        );

        res.status(201).json(schedule);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /medications/patient/:patientId/schedule/today
router.get('/patient/:patientId/schedule/today', async (req: AuthRequest, res: Response) => {
    try {
        const patientId = parseInt(req.params.patientId);

        // Verify access
        if (req.user.role === 'patient' && req.user.id !== patientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const schedule = await medicationService.getTodaySchedule(patientId);
        res.json(schedule);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
