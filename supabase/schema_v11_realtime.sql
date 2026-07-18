-- Enable Real-time for critical tables by adding them to the supabase_realtime publication
BEGIN;

-- Add tables to publication if they are not already there
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tests;
ALTER PUBLICATION supabase_realtime ADD TABLE batch_announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE test_submissions;

COMMIT;
