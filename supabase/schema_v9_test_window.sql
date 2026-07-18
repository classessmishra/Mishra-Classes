-- Run this in your Supabase SQL Editor to add time windows to test assignments

ALTER TABLE test_assignments ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE test_assignments ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;
