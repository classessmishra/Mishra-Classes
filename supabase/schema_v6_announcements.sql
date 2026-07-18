-- Run this in your Supabase SQL Editor
-- This adds the table for batch-specific announcements

CREATE TABLE IF NOT EXISTS batch_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
