-- 1. Upgrade chat_groups table
ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE CASCADE;
ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS is_direct_message BOOLEAN DEFAULT false;

-- 2. Insert the Hardcoded Admin User
-- We use a specific UUID so we can reference it reliably in the frontend
INSERT INTO users (id, full_name, email, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'Mishra Classes (Official)', 'admin@mishraclasses.com', 'admin')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
