-- Create the main flights table for ATC flight strips
CREATE TABLE IF NOT EXISTS flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    callsign VARCHAR(10) NOT NULL UNIQUE,
    aircraft_type VARCHAR(10) NOT NULL,
    departure VARCHAR(4) NOT NULL,
    arrival VARCHAR(4) NOT NULL,
    altitude VARCHAR(10) NOT NULL,
    speed VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('delivery', 'ground', 'tower', 'departure', 'approach', 'control')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status);

-- Create index on callsign for faster lookups
CREATE INDEX IF NOT EXISTS idx_flights_callsign ON flights(callsign);

-- Create index on updated_at for real-time sync
CREATE INDEX IF NOT EXISTS idx_flights_updated_at ON flights(updated_at);
