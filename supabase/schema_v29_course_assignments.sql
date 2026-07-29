-- 1. Add course_id column to test_assignments
ALTER TABLE test_assignments ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- 2. Drop the old check constraint dynamically
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'test_assignments'::regclass AND contype = 'c';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE test_assignments DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- 3. Add the new check constraint to ensure at least one target is specified
ALTER TABLE test_assignments ADD CONSTRAINT test_assignments_target_check 
CHECK (batch_id IS NOT NULL OR student_id IS NOT NULL OR course_id IS NOT NULL);
