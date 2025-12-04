import { pool } from '../server';

export interface DoseLog {
    id: number;
    medication_id: number;
    schedule_id?: number;
    scheduled_datetime: string;
    actual_datetime?: string;
    status: 'taken' | 'missed' | 'skipped' | 'upcoming';
    notes?: string;
}

export const logDose = async (
    medicationId: number,
    scheduledDatetime: string,
    status: 'taken' | 'missed' | 'skipped',
    actualDatetime?: string,
    scheduleId?: number,
    notes?: string
): Promise<DoseLog> => {
    const result = await pool.query(
        `INSERT INTO dose_logs (medication_id, schedule_id, scheduled_datetime, actual_datetime, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
        [medicationId, scheduleId, scheduledDatetime, actualDatetime || new Date().toISOString(), status, notes]
    );

    // Update current supply if taken
    if (status === 'taken') {
        await pool.query(
            `UPDATE medications 
       SET current_supply = current_supply - 1 
       WHERE id = $1 AND current_supply > 0`,
            [medicationId]
        );
    }

    return result.rows[0];
};

export const getDoseLogs = async (patientId: number, limit: number = 50): Promise<DoseLog[]> => {
    const result = await pool.query(
        `SELECT dl.*, m.name as medication_name
     FROM dose_logs dl
     JOIN medications m ON dl.medication_id = m.id
     WHERE m.patient_id = $1
     ORDER BY dl.actual_datetime DESC
     LIMIT $2`,
        [patientId, limit]
    );

    return result.rows;
};
