-- Phase 1: Database Schema Expansion for Course Tests

-- 1. Create course_tests table
CREATE TABLE IF NOT EXISTS course_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    max_attempts INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, test_id)
);

-- 2. Modify test_submissions to add course_id
ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- 3. RLS Policies for course_tests
-- Disable RLS to allow inserts from server actions without auth.uid() 
-- (since app uses custom cookie auth)
ALTER TABLE course_tests DISABLE ROW LEVEL SECURITY;
