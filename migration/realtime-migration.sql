-- ============================================
-- REALTIME COLLABORATION MIGRATION
-- Add this to your Supabase SQL Editor
-- ============================================

-- Create active_sessions table for tracking user presence
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE,
  cursor_position INTEGER DEFAULT 0,
  selection_start INTEGER,
  selection_end INTEGER,
  color TEXT NOT NULL, -- User's cursor color
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- Create index for faster queries
CREATE INDEX idx_active_sessions_workspace_id ON active_sessions(workspace_id);
CREATE INDEX idx_active_sessions_snippet_id ON active_sessions(snippet_id);
CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);

-- Enable RLS
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for active_sessions
-- Users can view all active sessions in workspaces they're members of
CREATE POLICY "active_sessions_select"
  ON active_sessions FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

-- Users can insert their own session
CREATE POLICY "active_sessions_insert"
  ON active_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own session
CREATE POLICY "active_sessions_update"
  ON active_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own session
CREATE POLICY "active_sessions_delete"
  ON active_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Function to clean up stale sessions (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$;

-- ============================================
-- ENABLE REALTIME ON TABLES
-- ============================================
-- Run these commands in Supabase Dashboard > Database > Replication
-- OR run them here:

-- Enable realtime for snippets table
ALTER PUBLICATION supabase_realtime ADD TABLE snippets;

-- Enable realtime for active_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;

-- Enable realtime for workspace_members (to track who joins/leaves)
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_members;

-- ============================================
-- TABLES THAT NEED REALTIME ENABLED:
-- ============================================
-- 1. snippets - For real-time content updates
-- 2. active_sessions - For cursor positions and user presence
-- 3. workspace_members - For tracking workspace membership changes
-- ============================================
