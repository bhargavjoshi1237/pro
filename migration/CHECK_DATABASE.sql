-- ============================================
-- DATABASE CHECK - Verify Cover Image Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if columns exist in workspaces table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'workspaces'
  AND column_name IN ('cover_image', 'icon', 'icon_color')
ORDER BY column_name;
-- Expected: cover_image (text), icon (text), icon_color (text)

-- 2. Check current workspace data
SELECT 
    id,
    name,
    icon,
    cover_image,
    CASE 
        WHEN cover_image IS NULL THEN '❌ No cover'
        WHEN cover_image = '' THEN '⚠️ Empty string'
        ELSE '✅ Has cover'
    END as cover_status,
    created_at
FROM workspaces
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if any workspaces have cover images
SELECT 
    COUNT(*) as total_workspaces,
    COUNT(cover_image) as workspaces_with_cover,
    COUNT(icon) as workspaces_with_icon
FROM workspaces;

-- 4. If columns don't exist, create them
-- (Uncomment and run if needed)
/*
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT;
*/

-- 5. Test update (replace YOUR_WORKSPACE_ID with actual ID)
/*
UPDATE workspaces 
SET cover_image = 'https://example.com/test.jpg',
    icon = 'document'
WHERE id = 'YOUR_WORKSPACE_ID';

-- Then verify
SELECT id, name, icon, cover_image 
FROM workspaces 
WHERE id = 'YOUR_WORKSPACE_ID';
*/

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If cover_image is being saved but disappears on refresh:

-- Check 1: Verify the data is actually in the database
SELECT id, name, cover_image 
FROM workspaces 
WHERE cover_image IS NOT NULL 
  AND cover_image != '';

-- Check 2: Check for any triggers that might be clearing the field
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'workspaces';

-- Check 3: Check RLS policies on workspaces table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'workspaces'
ORDER BY policyname;

-- ============================================
-- EXPECTED RESULTS
-- ============================================

-- Query 1 should show:
-- cover_image | text | YES | NULL
-- icon        | text | YES | NULL

-- Query 2 should show your workspaces with their cover images

-- Query 3 should show counts of workspaces with covers/icons

-- If any query fails, the columns might not exist yet
-- Run the migration: workspace-cover-icon-migration.sql
