-- Add validity duration for a course
ALTER TABLE courses ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 365;

-- Add expires_at column to purchases table to track when a student loses access
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
