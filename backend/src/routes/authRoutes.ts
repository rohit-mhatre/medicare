import { Router, Response } from 'express';
import { registerUser, loginUser, linkPatientToCaregiver, getLinkedPatients } from '../services/authService';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { pool } from '../server';

const router = Router();

// POST /auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, name, role, timezone } = req.body;

        if (!email || !password || !name || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!['patient', 'caregiver'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const result = await registerUser(email, password, name, role, timezone);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        const result = await loginUser(email, password);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

// POST /auth/link-patient (caregiver only)
router.post('/link-patient', authenticate, requireRole('caregiver'), async (req: AuthRequest, res: Response) => {
    try {
        const { patientEmail } = req.body;

        if (!patientEmail) {
            return res.status(400).json({ error: 'Missing patient email' });
        }

        await linkPatientToCaregiver(req.user.id, patientEmail);
        res.status(201).json({ message: 'Patient linked successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /auth/linked-patients (caregiver only)
router.get('/linked-patients', authenticate, requireRole('caregiver'), async (req: AuthRequest, res: Response) => {
    try {
        const patients = await getLinkedPatients(req.user.id);
        res.json(patients);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /auth/push-token (store Expo push token)
router.post('/push-token', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { pushToken } = req.body;

        if (!pushToken) {
            return res.status(400).json({ error: 'Missing push token' });
        }

        await pool.query(
            'UPDATE users SET push_token = $1, updated_at = NOW() WHERE id = $2',
            [pushToken, req.user.id]
        );

        res.json({ message: 'Push token saved' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
