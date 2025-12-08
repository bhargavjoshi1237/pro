-- Verification script for snippet_comments setup
-- Run this after the main migration to verify everything is configured correctly

-- 1. Check if table exists
SELECT 
  'snippet_comments table exists' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'snippet_comments'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END AS status;

-- 2. Check if indexes exist
SELECT 
  'Indexes created' AS check_name,
  CASE WHEN COUNT(*) >= 4 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pg_indexes 
WHERE tablename = 'snippet_comments';

-- 3. Check if RLS is enabled
SELECT 
  'RLS enabled' AS check_name,
  CASE WHEN relrowsecurity THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pg_class 
WHERE relname = 'snippet_comments';

-- 4. Check if all policies exist
SELECT 
  'RLS policies created' AS check_name,
  CASE WHEN COUNT(*) = 4 THEN '✅ PASS' ELSE '❌ FAIL - Found ' || COUNT(*) || ' policies, expected 4' END AS status
FROM pg_policies 
WHERE tablename = 'snippet_comments';

-- 5. List all policies (for verification)
SELECT 
  policyname,
  cmd AS operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read comments'
    WHEN cmd = 'INSERT' THEN 'Create comments'
    WHEN cmd = 'UPDATE' THEN 'Edit own comments'
    WHEN cmd = 'DELETE' THEN 'Delete own comments'
  END AS description
FROM pg_policies 
WHERE tablename = 'snippet_comments'
ORDER BY cmd;

-- 6. Check if trigger exists
SELECT 
  'Update trigger exists' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_snippet_comments_updated_at_trigger'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END AS status;

-- 7. Check if realtime is enabled
SELECT 
  'Realtime enabled' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'snippet_comments'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END AS status;

-- 8. Check current user authentication
SELECT 
  'User authenticated' AS check_name,
  CASE WHEN auth.uid() IS NOT NULL 
    THEN '✅ PASS - User ID: ' || auth.uid()::text 
    ELSE '❌ FAIL - Not logged in' 
  END AS status;

-- 9. Check workspace membership
SELECT 
  'Workspace membership' AS check_name,
  CASE WHEN COUNT(*) > 0 
    THEN '✅ PASS - Member of ' || COUNT(*) || ' workspace(s)' 
    ELSE '❌ FAIL - Not a member of any workspace' 
  END AS status
FROM workspace_members 
WHERE user_id = auth.uid();

-- 10. Summary of accessible snippets
SELECT 
  'Accessible snippets' AS check_name,
  CASE WHEN COUNT(*) > 0 
    THEN '✅ ' || COUNT(*) || ' snippet(s) accessible' 
    ELSE '⚠️  No snippets accessible (create one to test)' 
  END AS status
FROM snippets s
WHERE s.workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
);

-- Final message
SELECT 
  '=== VERIFICATION COMPLETE ===' AS message,
  'If all checks pass, you can start using comments!' AS next_step;
