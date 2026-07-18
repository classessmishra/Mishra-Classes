-- Add show_on_checkout column to coupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS show_on_checkout BOOLEAN DEFAULT TRUE;
