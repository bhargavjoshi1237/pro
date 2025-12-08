-- Shares Migration
-- Create shares table for snippet and folder sharing

CREATE TABLE IF NOT EXISTS shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('public', 'email')), -- public or email-only
  allowed_emails TEXT[] DEFAULT NULL, -- Array of emails allowed to access (for email share type)
  access_level TEXT NOT NULL CHECK (access_level IN ('view', 'edit')) DEFAULT 'view', -- view or edit
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shares_snippet_id ON shares(snippet_id);
CREATE INDEX IF NOT EXISTS idx_shares_folder_id ON shares(folder_id);
CREATE INDEX IF NOT EXISTS idx_shares_workspace_id ON shares(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shares_share_token ON shares(share_token);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON shares(shared_by);

-- Enable RLS
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shares
-- Users can view shares they created
CREATE POLICY "shares_select_own" ON shares FOR SELECT
  USING (shared_by = auth.uid());

-- Workspace members can view shares in their workspace
CREATE POLICY "shares_select_workspace" ON shares FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Users can insert shares for workspace items they have access to
CREATE POLICY "shares_insert" ON shares FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Users can update their own shares
CREATE POLICY "shares_update" ON shares FOR UPDATE
  USING (shared_by = auth.uid());

-- Users can delete their own shares
CREATE POLICY "shares_delete" ON shares FOR DELETE
  USING (shared_by = auth.uid());

-- Public access policy (no auth required for viewing public shares)
CREATE POLICY "shares_select_public" ON shares FOR SELECT
  USING (share_type = 'public' OR (share_type = 'email' AND auth.jwt() ->> 'email' = ANY(allowed_emails)));
