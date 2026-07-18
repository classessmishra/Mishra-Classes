-- Run this in your Supabase SQL Editor
-- This adds the table for dynamic hero banners

CREATE TABLE IF NOT EXISTS hero_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    badge_text TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial dummy banners so the user has something to see
INSERT INTO hero_banners (image_url, title, subtitle, badge_text, order_index) VALUES
('/images/hero_bg.png', 'Master English for Board Exams & Fluent Speech', 'Join our comprehensive batch designed for top rankers. Expert faculty, high-quality study material, and rigorous testing.', 'Registration Open', 1),
('/images/hero_bg.png', 'Crack Competitive Exams with Confidence', 'Specialized batches for CUET, NDA, and other entrance exams. Learn from the best and secure your future.', 'New Batches', 2),
('/images/hero_bg.png', 'Spoken English & Personality Development', 'Overcome your hesitation. Speak fluently in public and ace your interviews with our dedicated spoken English classes.', 'Limited Seats', 3)
ON CONFLICT DO NOTHING;
