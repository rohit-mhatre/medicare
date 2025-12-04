-- Vitals table
CREATE TABLE vitals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'blood_pressure', 'heart_rate', 'glucose', 'weight'
    value JSONB NOT NULL, -- { systolic: 120, diastolic: 80 } or { value: 75 }
    unit VARCHAR(20), -- 'mmHg', 'bpm', 'mg/dL', 'kg'
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_vitals_user ON vitals(user_id);
CREATE INDEX idx_vitals_type ON vitals(type);
CREATE INDEX idx_vitals_date ON vitals(recorded_at DESC);
