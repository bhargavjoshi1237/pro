-- Fix relationship between workspace_ai_messages and user_id
-- This allows Supabase client to properly join with the user/profile data

-- Drop the old foreign key if it exists (referencing auth.users)
ALTER TABLE workspace_ai_messages
DROP CONSTRAINT IF EXISTS workspace_ai_messages_user_id_fkey;

-- Add new foreign key referencing profiles
-- This enables the user:user_id join in the client
ALTER TABLE workspace_ai_messages
ADD CONSTRAINT workspace_ai_messages_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
