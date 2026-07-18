-- Users (Extends Supabase Auth)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    role TEXT CHECK (role IN ('admin', 'student')) DEFAULT 'student',
    full_name TEXT,
    phone TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batches
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch Enrollments
CREATE TABLE batch_students (
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (batch_id, student_id)
);

-- Courses / Content
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price NUMERIC,
    is_live BOOLEAN DEFAULT false,
    thumbnail_url TEXT
);

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    youtube_url TEXT,
    pdf_url TEXT,
    order_index INTEGER
);

-- Attendance
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id),
    student_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent')),
    UNIQUE(batch_id, student_id, date)
);

-- Tests & Assessments
CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id),
    title TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    total_marks INTEGER
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    correct_option_index INTEGER NOT NULL,
    positive_marks INTEGER DEFAULT 4,
    negative_marks INTEGER DEFAULT 1
);

CREATE TABLE test_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id),
    student_id UUID REFERENCES users(id),
    score INTEGER,
    time_taken_seconds INTEGER,
    answers JSONB, -- Map of question_id to selected_option_index
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    status TEXT DEFAULT 'pending'
);

-- Test Assignments
CREATE TABLE test_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Either batch_id OR student_id must be provided
    CHECK (batch_id IS NOT NULL OR student_id IS NOT NULL)
);

-- Store Items
CREATE TABLE store_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    thumbnail_url TEXT,
    file_url TEXT,
    rating NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat System
CREATE TABLE chat_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_members (
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
