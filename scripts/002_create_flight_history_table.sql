-- Create flight history table to track status changes
CREATE TABLE IF NOT EXISTS flight_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT DEFAULT ''
);

-- Create index on flight_id for faster history lookups
CREATE INDEX IF NOT EXISTS idx_flight_history_flight_id ON flight_history(flight_id);

-- Create index on changed_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_flight_history_changed_at ON flight_history(changed_at);
