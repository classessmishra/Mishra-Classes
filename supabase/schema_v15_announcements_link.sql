-- Add link_url to batch_announcements table
ALTER TABLE batch_announcements ADD COLUMN IF NOT EXISTS link_url TEXT;
