-- Add time_spent column to test_submissions to track time spent on each question
ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS time_spent JSONB;
