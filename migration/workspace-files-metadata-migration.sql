-- ============================================
-- WORKSPACE FILES TRACKING MIGRATION
-- ============================================

-- Table to track file uploads and their metadata
CREATE TABLE IF NOT EXISTS workspace_file_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL, -- Full path in storage bucket
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, file_path)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_file_metadata_workspace_id ON workspace_file_metadata(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_file_metadata_uploaded_by ON workspace_file_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_workspace_file_metadata_file_path ON workspace_file_metadata(file_path);

-- Enable RLS
ALTER TABLE workspace_file_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "workspace_file_metadata_select" ON workspace_file_metadata;
CREATE POLICY "workspace_file_metadata_select" ON workspace_file_metadata FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "workspace_file_metadata_insert" ON workspace_file_metadata;
CREATE POLICY "workspace_file_metadata_insert" ON workspace_file_metadata FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "workspace_file_metadata_update" ON workspace_file_metadata;
CREATE POLICY "workspace_file_metadata_update" ON workspace_file_metadata FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "workspace_file_metadata_delete" ON workspace_file_metadata;
CREATE POLICY "workspace_file_metadata_delete" ON workspace_file_metadata FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'workspace_file_metadata') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE workspace_file_metadata;
  END IF;
END $$;
