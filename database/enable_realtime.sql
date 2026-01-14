-- Enable Supabase Realtime for Messages and Conversations
-- Run this in Supabase SQL Editor

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable Realtime for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Verify Realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Note: You can also enable Realtime via Supabase Dashboard:
-- 1. Go to Database → Replication
-- 2. Enable replication for 'messages' and 'conversations' tables
