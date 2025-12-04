-- Users table (patients and caregivers)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'patient' or 'caregiver'
    timezone VARCHAR(50) DEFAULT 'UTC',
    push_token VARCHAR(500), -- Expo push notification token
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Patient-Caregiver relationships
CREATE TABLE patient_caregivers (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    caregiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, caregiver_id)
);
CREATE INDEX idx_patient_caregivers_patient ON patient_caregivers(patient_id);
CREATE INDEX idx_patient_caregivers_caregiver ON patient_caregivers(caregiver_id);

-- Medications table
CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100), -- e.g., "500mg", "2 tablets"
    frequency VARCHAR(100), -- e.g., "Daily", "Twice daily", "Every 12 hours"
    instructions TEXT,
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for ongoing medications
    is_active BOOLEAN DEFAULT true,
    current_supply INTEGER,
    refill_threshold INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_medications_active ON medications(is_active);

-- Medication schedules (when doses should be taken)
CREATE TABLE medication_schedules (
    id SERIAL PRIMARY KEY,
    medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_time TIME NOT NULL, -- e.g., 08:00:00, 20:00:00
    days_of_week INTEGER[], -- Array: [0,1,2,3,4,5,6] for Sun-Sat, NULL for daily
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_schedules_medication ON medication_schedules(medication_id);

-- Dose logs (actual doses taken/missed/skipped)
CREATE TABLE dose_logs (
    id SERIAL PRIMARY KEY,
    medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES medication_schedules(id) ON DELETE SET NULL,
    scheduled_datetime TIMESTAMP NOT NULL, -- When dose was supposed to be taken
    actual_datetime TIMESTAMP, -- When dose was actually taken (NULL if missed/skipped)
    status VARCHAR(50) NOT NULL, -- 'taken', 'missed', 'skipped', 'upcoming'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_dose_logs_medication ON dose_logs(medication_id);
CREATE INDEX idx_dose_logs_scheduled ON dose_logs(scheduled_datetime DESC);
CREATE INDEX idx_dose_logs_status ON dose_logs(status);

-- Notifications table (for tracking sent notifications)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'medication_reminder', 'missed_dose', 'sos', 'streak'
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB, -- Additional metadata
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_sent ON notifications(sent_at DESC);
