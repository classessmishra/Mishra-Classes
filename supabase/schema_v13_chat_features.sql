-- 1. Add read-only mode to chat_groups
ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS is_read_only BOOLEAN DEFAULT false;

-- 2. Add reply_to_id to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- 3. Add cleared_at to chat_members for personal chat clearing
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMP WITH TIME ZONE DEFAULT '1970-01-01'::timestamp;

-- 4. Create an RPC to easily clear chat for a specific user
CREATE OR REPLACE FUNCTION clear_user_chat(p_group_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE chat_members 
    SET cleared_at = NOW() 
    WHERE group_id = p_group_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create an RPC to clear chat for EVERYONE (Admin use only)
-- We do this by actually deleting the messages from the group
CREATE OR REPLACE FUNCTION admin_clear_group_chat(p_group_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM messages WHERE group_id = p_group_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Optional: Create an RPC to toggle read-only mode for a group
CREATE OR REPLACE FUNCTION toggle_group_read_only(p_group_id UUID, p_is_read_only BOOLEAN)
RETURNS void AS $$
BEGIN
    UPDATE chat_groups SET is_read_only = p_is_read_only WHERE id = p_group_id;
END;
$$ LANGUAGE plpgsql;
