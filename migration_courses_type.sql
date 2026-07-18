ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'live';

-- Existing rows will have 'live', which will be handled correctly by the UI.
-- You might also want to update the store_items table if notes should go there instead, 
-- but this allows notes and test series to be created as courses.
