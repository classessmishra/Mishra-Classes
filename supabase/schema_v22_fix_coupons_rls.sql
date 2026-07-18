-- Fix RLS for coupons to work with custom cookie-based auth
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;

-- Drop the old policy just to be clean
DROP POLICY IF EXISTS "Enable all access for admins on coupons" ON coupons;
