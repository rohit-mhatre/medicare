import { pool } from '../server';

export interface VitalLog {
    id: number;
    user_id: number;
    type: string;
    value: any;
    unit: string;
    recorded_at: string;
    notes?: string;
}

export const logVital = async (
    userId: number,
    type: string,
    value: any,
    unit: string,
    notes?: string
): Promise<VitalLog> => {
    const result = await pool.query(
        `INSERT INTO vitals (user_id, type, value, unit, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, type, value, unit, notes]
    );
    return result.rows[0];
};

export const getVitals = async (userId: number, type?: string): Promise<VitalLog[]> => {
    let query = 'SELECT * FROM vitals WHERE user_id = $1';
    const params: any[] = [userId];

    if (type) {
        query += ' AND type = $2';
        params.push(type);
    }

    query += ' ORDER BY recorded_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
};
