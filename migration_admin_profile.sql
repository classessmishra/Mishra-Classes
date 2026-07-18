ALTER TABLE users ADD COLUMN IF NOT EXISTS map_location TEXT;
NOTIFY pgrst, 'reload schema';
