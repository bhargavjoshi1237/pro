-- Workspace AI Chats Migration

-- Create workspace_ai_sessions table
CREATE TABLE IF NOT EXISTS workspace_ai_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workspace_ai_messages table
CREATE TABLE IF NOT EXISTS workspace_ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES workspace_ai_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null for AI
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_ai_sessions_workspace_id ON workspace_ai_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_ai_messages_session_id ON workspace_ai_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_workspace_ai_messages_created_at ON workspace_ai_messages(created_at);

-- Enable RLS
ALTER TABLE workspace_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_ai_sessions
CREATE POLICY "workspace_ai_sessions_select" ON workspace_ai_sessions FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace_ai_sessions_insert" ON workspace_ai_sessions FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace_ai_sessions_update" ON workspace_ai_sessions FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace_ai_sessions_delete" ON workspace_ai_sessions FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- RLS Policies for workspace_ai_messages
CREATE POLICY "workspace_ai_messages_select" ON workspace_ai_messages FOR SELECT
  USING (session_id IN (
    SELECT id FROM workspace_ai_sessions WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "workspace_ai_messages_insert" ON workspace_ai_messages FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM workspace_ai_sessions WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_ai_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_ai_messages;
