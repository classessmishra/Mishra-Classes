-- Add created_at to purchases table if it does not exist
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
