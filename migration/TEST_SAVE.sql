-- ============================================
-- TEST: Verify Save Works
-- ============================================

-- Step 1: Get your user ID
SELECT auth.uid() as my_user_id;
-- Copy this ID

-- Step 2: Get a workspace you own
SELECT 
    w.id,
    w.name,
    w.owner_id,
    wm.user_id as member_user_id,
    wm.role,
    CASE 
        WHEN w.owner_id = auth.uid() THEN '✅ You own this'
        WHEN wm.user_id = auth.uid() THEN '✅ You are a member'
        ELSE '❌ Not your workspace'
    END as access
FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE wm.user_id = auth.uid() OR w.owner_id = auth.uid()
LIMIT 5;

-- Step 3: Test update (replace YOUR_WORKSPACE_ID with ID from above)
/*
UPDATE workspaces 
SET 
    icon = 'rocket',
    cover_image = 'https://lvfkbsuckitzcgamvhex.supabase.co/storage/v1/object/public/workspace-assets/covers/test.jpg'
WHERE id = 'YOUR_WORKSPACE_ID';
*/

-- Step 4: Verify it saved
/*
SELECT id, name, icon, cover_image 
FROM workspaces 
WHERE id = 'YOUR_WORKSPACE_ID';
*/

-- ============================================
-- Check RLS Policies
-- ============================================

-- Check if UPDATE policy exists for workspaces
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'workspaces'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- If no UPDATE policy exists, you need to create one:
/*
CREATE POLICY "Users can update their workspaces"
ON workspaces FOR UPDATE
TO authenticated
USING (
    owner_id = auth.uid() 
    OR id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    owner_id = auth.uid() 
    OR id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
    )
);
*/

-- ============================================
-- Test from App Perspective
-- ============================================

-- This simulates what the app does:
-- 1. User uploads image to storage (already works)
-- 2. User clicks save
-- 3. App runs UPDATE query

-- To test if RLS is blocking:
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "YOUR_USER_ID_HERE"}';

-- Then try the UPDATE
-- If it fails, RLS is blocking you

-- ============================================
