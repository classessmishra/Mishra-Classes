-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('flat', 'percent')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alter courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS detailed_description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS syllabus_features JSONB DEFAULT '[]'::jsonb;

-- Alter purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS amount_paid NUMERIC;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS receipt_id TEXT UNIQUE;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Enable RLS on coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policies for coupons
CREATE POLICY "Enable read access for all users on active coupons"
ON coupons FOR SELECT
USING (is_active = true);

CREATE POLICY "Enable all access for admins on coupons"
ON coupons FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
);
