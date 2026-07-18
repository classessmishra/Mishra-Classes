-- Add last_read_at to chat_members
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an RPC to safely update last_read_at for any user
CREATE OR REPLACE FUNCTION mark_chat_read(p_group_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO chat_members (group_id, user_id, last_read_at)
    VALUES (p_group_id, p_user_id, NOW())
    ON CONFLICT (group_id, user_id) 
    DO UPDATE SET last_read_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Also create a function to fetch groups with unread counts for a user
CREATE OR REPLACE FUNCTION get_user_chat_groups(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    is_direct_message BOOLEAN,
    batch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    last_message_content TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cg.id,
        cg.name,
        cg.is_direct_message,
        cg.batch_id,
        cg.created_at,
        (SELECT content FROM messages m WHERE m.group_id = cg.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
        (SELECT m.created_at FROM messages m WHERE m.group_id = cg.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.group_id = cg.id 
         AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01'::timestamp)
         AND m.sender_id != p_user_id) as unread_count
    FROM chat_groups cg
    JOIN chat_members cm ON cm.group_id = cg.id
    WHERE cm.user_id = p_user_id
    ORDER BY last_message_time DESC NULLS LAST, cg.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- For Admin, we need a special RPC because Admin sees ALL groups, even if not explicitly in chat_members
CREATE OR REPLACE FUNCTION get_admin_chat_groups(p_admin_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    is_direct_message BOOLEAN,
    batch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    last_message_content TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cg.id,
        cg.name,
        cg.is_direct_message,
        cg.batch_id,
        cg.created_at,
        (SELECT content FROM messages m WHERE m.group_id = cg.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
        (SELECT m.created_at FROM messages m WHERE m.group_id = cg.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.group_id = cg.id 
         AND m.created_at > COALESCE(
            (SELECT last_read_at FROM chat_members cm WHERE cm.group_id = cg.id AND cm.user_id = p_admin_id LIMIT 1), 
            '1970-01-01'::timestamp
         )
         AND m.sender_id != p_admin_id) as unread_count
    FROM chat_groups cg
    ORDER BY last_message_time DESC NULLS LAST, cg.created_at DESC;
END;
$$ LANGUAGE plpgsql;
