ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_locks JSONB DEFAULT '{\" "basic_info\: false, \documents\: false}'::jsonb; 
