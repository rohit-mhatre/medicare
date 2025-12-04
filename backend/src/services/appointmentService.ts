import { pool } from '../server';

export interface Appointment {
    id: number;
    user_id: number;
    doctor_name: string;
    location?: string;
    date_time: string;
    notes?: string;
    created_at: string;
}

export const createAppointment = async (
    userId: number,
    doctorName: string,
    dateTime: string,
    location?: string,
    notes?: string
): Promise<Appointment> => {
    const result = await pool.query(
        `INSERT INTO appointments (user_id, doctor_name, date_time, location, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, doctorName, dateTime, location, notes]
    );
    return result.rows[0];
};

export const getAppointments = async (userId: number): Promise<Appointment[]> => {
    const result = await pool.query(
        'SELECT * FROM appointments WHERE user_id = $1 ORDER BY date_time ASC',
        [userId]
    );
    return result.rows;
};

export const deleteAppointment = async (id: number): Promise<void> => {
    await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
};
