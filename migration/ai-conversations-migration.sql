-- AI Conversations Migration
-- Adds conversation_id to ai_chat_history for proper chat grouping
-- and creates ai_conversations table for metadata tracking

-- Add conversation_id column to ai_chat_history
ALTER TABLE ai_chat_history 
ADD COLUMN conversation_id UUID;

-- Create an index for efficient conversation queries
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_conversation_id 
ON ai_chat_history(conversation_id, created_at DESC);

-- Create a conversations table to track metadata per chat
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id 
ON ai_conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at 
ON ai_conversations(created_at DESC);

-- Enable RLS on ai_conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "ai_conversations_select" ON ai_conversations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "ai_conversations_insert" ON ai_conversations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_conversations_update" ON ai_conversations FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_conversations_delete" ON ai_conversations FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for ai_conversations
ALTER PUBLICATION supabase_realtime ADD TABLE ai_conversations;

-- Add foreign key constraint from ai_chat_history to ai_conversations
ALTER TABLE ai_chat_history
ADD CONSTRAINT fk_ai_chat_history_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE;
