ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_name TEXT DEFAULT 'Prof. A. Mishra';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS validity_text TEXT DEFAULT 'Access for 1 Year';
