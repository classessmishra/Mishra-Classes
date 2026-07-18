CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    link_url TEXT,
    badge_text TEXT,
    icon_name TEXT,
    bg_gradient TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: In Supabase, if the uuid_generate_v4() function is not available, you might need to enable the "uuid-ossp" extension.
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Migrate data from hero_banners if it exists (optional, keeping it simple here)
-- INSERT INTO advertisements (section, title, subtitle, image_url, badge_text, order_index, is_active)
-- SELECT 'hero', title, subtitle, image_url, badge_text, order_index, is_active FROM hero_banners;

NOTIFY pgrst, 'reload schema';
