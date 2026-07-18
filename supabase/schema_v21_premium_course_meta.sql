-- Add premium course features
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_hours TEXT DEFAULT '100+ Hours';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'Hinglish';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'Beginner to Advanced';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS has_certificate BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS demo_video_url TEXT;
