-- Phase 1: Database Schema Expansion for Free Courses & Folders

-- 1. Add is_free column to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- 2. Create course_folders table
CREATE TABLE IF NOT EXISTS course_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security temporarily to avoid Auth mismatch issues with custom cookies
ALTER TABLE course_folders DISABLE ROW LEVEL SECURITY;

-- 3. Add folder_id to content tables
ALTER TABLE recorded_classes ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES course_folders(id) ON DELETE SET NULL;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES course_folders(id) ON DELETE SET NULL;
ALTER TABLE course_materials ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES course_folders(id) ON DELETE SET NULL;
ALTER TABLE course_tests ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES course_folders(id) ON DELETE SET NULL;
