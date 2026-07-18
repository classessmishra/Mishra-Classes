-- Run this in your Supabase SQL Editor to fix the missing columns error for tests

ALTER TABLE tests ADD COLUMN IF NOT EXISTS test_title TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS scramble_enabled BOOLEAN DEFAULT false;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb;

-- Optional: if the table was completely missing, this would recreate it, but the error says "Could not find the 'questions' column of 'tests'", meaning the table exists.
