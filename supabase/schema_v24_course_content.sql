-- Phase 1: Course Content Tables Expansion

-- 1. Live Classes Table
CREATE TABLE IF NOT EXISTS live_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_link TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Recorded Classes Table
CREATE TABLE IF NOT EXISTS recorded_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL, -- embedded iframe link
    duration_mins INTEGER,
    class_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Course Materials Table
CREATE TABLE IF NOT EXISTS course_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    type TEXT, -- e.g., 'pdf', 'image'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security temporarily to avoid Auth mismatch issues with custom cookies
-- Since the platform uses custom cookie auth instead of Supabase Auth,
-- auth.uid() returns null, causing RLS to fail.
-- Security is handled at the server-action level.
ALTER TABLE live_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recorded_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials DISABLE ROW LEVEL SECURITY;

-- Insert storage bucket for course materials if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-materials', 'course-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for course-materials bucket
-- Allow public read access
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'course-materials');

-- Allow all inserts/updates/deletes (Server Action handles admin auth)
CREATE POLICY "Enable all access for admin inserts" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Enable all access for admin updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'course-materials');

CREATE POLICY "Enable all access for admin deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'course-materials');
