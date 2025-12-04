import { pool } from '../server';
// In a real app, import Expo SDK here
// import { Expo } from 'expo-server-sdk';

// const expo = new Expo();

export interface Notification {
    id: number;
    user_id: number;
    type: string;
    title: string;
    body: string;
    data?: any;
    sent_at: string;
    read_at?: string;
}

export const sendNotification = async (
    userId: number,
    type: string,
    title: string,
    body: string,
    data?: any
): Promise<Notification> => {
    // 1. Get user's push token
    const userResult = await pool.query('SELECT push_token FROM users WHERE id = $1', [userId]);
    const pushToken = userResult.rows[0]?.push_token;

    if (pushToken) {
        // 2. Send to Expo (mocked for now)
        console.log(`[PUSH] Sending to ${pushToken}: ${title} - ${body}`);
        // await expo.sendPushNotificationsAsync([...]);
    }

    // 3. Log to database
    const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [userId, type, title, body, data]
    );

    return result.rows[0];
};

export const getNotifications = async (userId: number, limit: number = 20): Promise<Notification[]> => {
    const result = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC LIMIT $2',
        [userId, limit]
    );
    return result.rows;
};

export const markAsRead = async (notificationId: number, userId: number): Promise<void> => {
    await pool.query(
        'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
    );
};

export const sendSOSNotification = async (patientId: number, latitude?: number, longitude?: number) => {
    // 1. Find linked caregivers
    const caregiversResult = await pool.query(
        `SELECT u.id, u.push_token, u.name 
         FROM users u
         JOIN patient_caregivers pc ON u.id = pc.caregiver_id
         WHERE pc.patient_id = $1`,
        [patientId]
    );

    const patientResult = await pool.query('SELECT name FROM users WHERE id = $1', [patientId]);
    const patientName = patientResult.rows[0]?.name || 'Patient';

    const locationText = latitude && longitude
        ? `Location: https://maps.google.com/?q=${latitude},${longitude}`
        : 'Location not available';

    // 2. Send notification to each caregiver
    for (const caregiver of caregiversResult.rows) {
        if (caregiver.push_token) {
            // In real app, send via Expo SDK
            console.log(`[SOS] Sending to ${caregiver.name} (${caregiver.push_token}): SOS from ${patientName}! ${locationText}`);

            // Log to DB
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, body, data)
                 VALUES ($1, 'sos', $2, $3, $4)`,
                [caregiver.id, `SOS from ${patientName}`, `EMERGENCY! ${patientName} needs help. ${locationText}`, { latitude, longitude }]
            );
        }
    }
};
