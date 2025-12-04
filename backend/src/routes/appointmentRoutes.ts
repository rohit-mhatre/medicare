import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as appointmentService from '../services/appointmentService';

const router = Router();

router.use(authenticate);

// GET /appointments
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
                targetUserId = requestedId;
            }
        }

        const appointments = await appointmentService.getAppointments(targetUserId);
        res.json(appointments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /appointments
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { doctorName, dateTime, location, notes, patientId } = req.body;

        if (!doctorName || !dateTime) {
            return res.status(400).json({ error: 'Doctor name and date are required' });
        }

        let targetUserId = req.user.id;
        if (patientId) {
            if (req.user.role !== 'caregiver') {
                return res.status(403).json({ error: 'Only caregivers can create appointments for others' });
            }
            targetUserId = patientId;
        }

        const appointment = await appointmentService.createAppointment(
            targetUserId,
            doctorName,
            dateTime,
            location,
            notes
        );
        res.status(201).json(appointment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /appointments/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        await appointmentService.deleteAppointment(parseInt(req.params.id));
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
