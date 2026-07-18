-- Run this in your Supabase SQL Editor
-- This adds the email and password column so users can login and admins can manage it.

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password TEXT;
