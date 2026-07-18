-- Add link_url to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Function to clear all notifications for a specific user
CREATE OR REPLACE FUNCTION clear_all_notifications(p_user_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM notifications WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clear a single notification for a specific user
CREATE OR REPLACE FUNCTION clear_notification(p_notif_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM notifications WHERE id = p_notif_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
