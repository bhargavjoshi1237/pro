-- ============================================
-- FIX WORKSPACE MEMBERS RLS POLICIES
-- ============================================
-- This migration fixes the workspace_members RLS policies to allow 
-- editors and admins to add/manage members, not just owners

-- Drop existing policies
DROP POLICY IF EXISTS "members_insert" ON workspace_members;
DROP POLICY IF EXISTS "members_update" ON workspace_members;

-- Allow workspace owners OR members with 'owner'/'admin'/'editor' roles to add members
CREATE POLICY "members_insert"
  ON workspace_members FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Allow workspace owners OR members with 'owner'/'admin'/'editor' roles to update members
CREATE POLICY "members_update"
  ON workspace_members FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );
