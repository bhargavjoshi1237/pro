-- ============================================
-- TEST: Check if columns exist
-- Run this FIRST to diagnose the issue
-- ============================================

-- Test 1: Do the columns exist?
SELECT 
    column_name, 
    data_type,
    CASE 
        WHEN column_name IN ('cover_image', 'icon') THEN '✅ Column exists'
        ELSE 'ℹ️ Other column'
    END as status
FROM information_schema.columns
WHERE table_name = 'workspaces'
ORDER BY column_name;

-- If you DON'T see 'cover_image' and 'icon' in the results above,
-- then the columns don't exist and you MUST run COMPLETE_FIX.sql

-- ============================================
-- If columns exist, test saving data
-- ============================================

-- Get a workspace ID to test with
SELECT id, name FROM workspaces LIMIT 1;

-- Copy the ID from above and paste it below (replace YOUR_WORKSPACE_ID)
-- Then uncomment and run:

/*
UPDATE workspaces 
SET 
    icon = 'rocket',
    cover_image = 'https://picsum.photos/800/400'
WHERE id = 'YOUR_WORKSPACE_ID';

-- Verify it saved
SELECT id, name, icon, cover_image 
FROM workspaces 
WHERE id = 'YOUR_WORKSPACE_ID';
*/

-- If the UPDATE fails with "column does not exist", 
-- you MUST run COMPLETE_FIX.sql first!

-- ============================================
-- RESULT INTERPRETATION
-- ============================================

-- Scenario 1: Columns don't exist
-- → Run COMPLETE_FIX.sql immediately

-- Scenario 2: Columns exist but UPDATE fails
-- → Check RLS policies

-- Scenario 3: UPDATE works but app doesn't save
-- → Check browser console for errors
-- → Look for "❌ Save error:" messages

-- ============================================
