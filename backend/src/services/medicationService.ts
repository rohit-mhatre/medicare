import { pool } from '../server';

export interface Medication {
    id: number;
    patient_id: number;
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    current_supply?: number;
    refill_threshold?: number;
}

export interface MedicationSchedule {
    id: number;
    medication_id: number;
    scheduled_time: string;
    days_of_week?: number[];
}

export const createMedication = async (
    patientId: number,
    name: string,
    dosage: string,
    frequency: string,
    instructions: string,
    startDate: string,
    endDate?: string,
    currentSupply?: number,
    refillThreshold?: number
): Promise<Medication> => {
    const result = await pool.query(
        `INSERT INTO medications (patient_id, name, dosage, frequency, instructions, start_date, end_date, current_supply, refill_threshold)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
        [patientId, name, dosage, frequency, instructions, startDate, endDate, currentSupply, refillThreshold]
    );

    return result.rows[0];
};

export const getMedicationsByPatient = async (patientId: number): Promise<Medication[]> => {
    const result = await pool.query(
        'SELECT * FROM medications WHERE patient_id = $1 ORDER BY created_at DESC',
        [patientId]
    );

    return result.rows;
};

export const updateMedication = async (
    id: number,
    updates: Partial<Medication>
): Promise<Medication> => {
    const fields = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

    const values = Object.values(updates);

    const result = await pool.query(
        `UPDATE medications SET ${fields}, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
        [id, ...values]
    );

    if (result.rows.length === 0) {
        throw new Error('Medication not found');
    }

    return result.rows[0];
};

export const deleteMedication = async (id: number): Promise<void> => {
    const result = await pool.query('DELETE FROM medications WHERE id = $1', [id]);

    if (result.rowCount === 0) {
        throw new Error('Medication not found');
    }
};

export const addMedicationSchedule = async (
    medicationId: number,
    scheduledTime: string,
    daysOfWeek?: number[]
): Promise<MedicationSchedule> => {
    const result = await pool.query(
        `INSERT INTO medication_schedules (medication_id, scheduled_time, days_of_week)
     VALUES ($1, $2, $3)
     RETURNING *`,
        [medicationId, scheduledTime, daysOfWeek]
    );

    return result.rows[0];
};

export const getTodaySchedule = async (patientId: number): Promise<any[]> => {
    const result = await pool.query(
        `SELECT
       m.id as medication_id,
       m.name,
       m.dosage,
       ms.scheduled_time,
       ms.id as schedule_id,
       dl.status,
       dl.actual_datetime
     FROM medications m
     JOIN medication_schedules ms ON m.id = ms.medication_id
     LEFT JOIN dose_logs dl ON dl.medication_id = m.id
       AND DATE(dl.scheduled_datetime) = CURRENT_DATE
       AND dl.schedule_id = ms.id
     WHERE m.patient_id = $1 AND m.is_active = true
     ORDER BY ms.scheduled_time`,
        [patientId]
    );

    return result.rows;
};
