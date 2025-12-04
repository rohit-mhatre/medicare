import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface User {
    id: number;
    email: string;
    name: string;
    role: 'patient' | 'caregiver';
    timezone?: string;
}

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

export const generateToken = (user: User): string => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, timezone: user.timezone },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

export const registerUser = async (
    email: string,
    password: string,
    name: string,
    role: 'patient' | 'caregiver',
    timezone: string = 'UTC'
): Promise<{ user: User; token: string }> => {
    // Check if user exists
    const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
    );

    if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, role, timezone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, role, timezone`,
        [email, passwordHash, name, role, timezone]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    return { user, token };
};

export const loginUser = async (
    email: string,
    password: string
): Promise<{ user: User; token: string }> => {
    // Find user
    const result = await pool.query(
        'SELECT id, email, password_hash, name, role, timezone FROM users WHERE email = $1',
        [email]
    );

    if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
        throw new Error('Invalid credentials');
    }

    const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        timezone: user.timezone,
    });

    return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, timezone: user.timezone },
        token,
    };
};

export const linkPatientToCaregiver = async (
    caregiverId: number,
    patientEmail: string
): Promise<void> => {
    // Find patient by email
    const patientResult = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND role = 'patient'",
        [patientEmail]
    );

    if (patientResult.rows.length === 0) {
        throw new Error('Patient not found');
    }

    const patientId = patientResult.rows[0].id;

    // Create relationship (use ON CONFLICT to handle duplicates)
    await pool.query(
        `INSERT INTO patient_caregivers (patient_id, caregiver_id)
     VALUES ($1, $2)
     ON CONFLICT (patient_id, caregiver_id) DO NOTHING`,
        [patientId, caregiverId]
    );
};

export const getLinkedPatients = async (caregiverId: number): Promise<User[]> => {
    const result = await pool.query(
        `SELECT u.id, u.email, u.name, u.role, u.timezone
     FROM users u
     JOIN patient_caregivers pc ON u.id = pc.patient_id
     WHERE pc.caregiver_id = $1`,
        [caregiverId]
    );

    return result.rows;
};
