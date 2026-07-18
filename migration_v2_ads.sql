-- Drop old advertisements table
DROP TABLE IF EXISTS advertisements;

-- Create new advertisements table with exact schema requested
CREATE TABLE advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_type TEXT NOT NULL,
    headline TEXT,
    subheadline TEXT,
    cta_text TEXT,
    cta_link TEXT,
    secondary_cta_text TEXT,
    bg_gradient TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notify pgrst
NOTIFY pgrst, 'reload schema';
