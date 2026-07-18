ALTER TABLE batches ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS subject TEXT;

CREATE TABLE IF NOT EXISTS batch_timings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

NOTIFY pgrst, 'reload schema';
