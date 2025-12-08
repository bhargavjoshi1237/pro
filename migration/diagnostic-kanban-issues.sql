-- ============================================
-- DIAGNOSTIC: Check Kanban Card Creation Issues
-- ============================================
-- This script helps diagnose why card creation is failing
-- Run these queries in your Supabase SQL Editor to check:

-- 1. Check if your user is in workspace_members
SELECT wm.* FROM workspace_members wm 
WHERE wm.user_id = auth.uid()
LIMIT 10;

-- 2. Check your workspace roles
SELECT DISTINCT role FROM workspace_members 
WHERE user_id = auth.uid();

-- 3. Try a simple card insert (without the created_by trigger)
-- If this works, the issue is with the created_by field or RLS on profiles join
INSERT INTO kanban_cards (column_id, title, position, created_by)
VALUES (
  (SELECT id FROM kanban_columns LIMIT 1),
  'Test Card',
  0,
  auth.uid()
)
RETURNING *;

-- 4. Check if there are any RLS policy issues
-- Enable query logging in Supabase dashboard to see exact RLS errors
