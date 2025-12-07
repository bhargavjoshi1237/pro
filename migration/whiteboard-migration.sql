-- ============================================
-- WHITEBOARD FEATURE MIGRATION
-- Add this to your Supabase SQL Editor
-- ============================================

-- Create whiteboards table
CREATE TABLE IF NOT EXISTS whiteboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  yjs_state BYTEA, -- Binary state for Yjs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id) -- One whiteboard per workspace for now
);

-- Enable RLS
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "whiteboards_select"
  ON whiteboards FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "whiteboards_insert"
  ON whiteboards FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "whiteboards_update"
  ON whiteboards FOR UPDATE
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

-- Add whiteboard_id to active_sessions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_sessions' AND column_name = 'whiteboard_id') THEN
        ALTER TABLE active_sessions ADD COLUMN whiteboard_id UUID REFERENCES whiteboards(id) ON DELETE CASCADE;
        CREATE INDEX idx_active_sessions_whiteboard_id ON active_sessions(whiteboard_id);
    END IF;
END $$;

-- Enable realtime for whiteboards
ALTER PUBLICATION supabase_realtime ADD TABLE whiteboards;
