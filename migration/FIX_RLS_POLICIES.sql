-- ============================================
-- FIX RLS POLICIES FOR WORKSPACES TABLE
-- Run this if save is failing silently
-- ============================================

-- Check current policies
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN roles = '{authenticated}' THEN 'authenticated'
        WHEN roles = '{public}' THEN 'public'
        ELSE roles::text
    END as who_can_access
FROM pg_policies 
WHERE tablename = 'workspaces'
ORDER BY cmd, policyname;

-- ============================================
-- Create/Update RLS Policies
-- ============================================

-- Drop existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Users can update their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace members can update" ON workspaces;
DROP POLICY IF EXISTS "Allow workspace updates" ON workspaces;

-- Create comprehensive UPDATE policy
CREATE POLICY "Users can update their workspaces"
ON workspaces FOR UPDATE
TO authenticated
USING (
    -- User is the owner
    owner_id = auth.uid() 
    OR 
    -- User is a member of the workspace
    id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    -- Same conditions for the updated data
    owner_id = auth.uid() 
    OR 
    id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
    )
);

-- Verify policy was created
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN roles = '{authenticated}' THEN '✅ Authenticated users'
        ELSE roles::text
    END as applies_to
FROM pg_policies 
WHERE tablename = 'workspaces'
  AND cmd = 'UPDATE';

-- ============================================
-- Test the policy
-- ============================================

-- Get a workspace you own
SELECT 
    id,
    name,
    owner_id,
    CASE 
        WHEN owner_id = auth.uid() THEN '✅ You own this'
        ELSE '❌ Not yours'
    END as ownership
FROM workspaces
WHERE owner_id = auth.uid()
   OR id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
LIMIT 1;

-- Try updating it (replace YOUR_WORKSPACE_ID)
/*
UPDATE workspaces 
SET 
    icon = 'rocket',
    cover_image = 'https://lvfkbsuckitzcgamvhex.supabase.co/storage/v1/object/public/workspace-assets/covers/test.jpg'
WHERE id = 'YOUR_WORKSPACE_ID';

-- Check if it worked
SELECT id, name, icon, cover_image 
FROM workspaces 
WHERE id = 'YOUR_WORKSPACE_ID';
*/

-- ============================================
-- If still not working, check for other issues
-- ============================================

-- 1. Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workspaces'
  AND column_name IN ('cover_image', 'icon');

-- 2. Check if you have any triggers that might interfere
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'workspaces';

-- 3. Check table permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'workspaces'
  AND grantee = 'authenticated';

-- ============================================
