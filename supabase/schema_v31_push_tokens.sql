-- Migration: Add expo_push_token to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
