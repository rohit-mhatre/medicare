import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRoutes from './routes/authRoutes';
import medicationRoutes from './routes/medicationRoutes';

import doseRoutes from './routes/doseRoutes';
import notificationRoutes from './routes/notificationRoutes';
import vitalsRoutes from './routes/vitalsRoutes';
import appointmentRoutes from './routes/appointmentRoutes';

app.use('/auth', authRoutes);
app.use('/medications', medicationRoutes);
app.use('/doses', doseRoutes);
app.use('/notifications', notificationRoutes);
app.use('/vitals', vitalsRoutes);
app.use('/appointments', appointmentRoutes);

// PostgreSQL connection
export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'medicare',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err.stack);
    } else {
        console.log('✓ Database connected');
        release();
    }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✓ Server running on http://localhost:${PORT}`);
    });
}
