-- ============================================
-- DEBUG: Kanban Card Creation Issues
-- ============================================
-- This migration helps diagnose and fix kanban card creation problems

-- Step 1: Create a function to check user's workspace access
CREATE OR REPLACE FUNCTION check_user_workspace_access(p_workspace_id UUID)
RETURNS TABLE(user_id UUID, workspace_id UUID, role TEXT, has_access BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wm.user_id,
    wm.workspace_id,
    wm.role,
    (wm.role IN ('owner', 'editor'))::BOOLEAN as has_access
  FROM workspace_members wm
  WHERE wm.workspace_id = p_workspace_id
    AND wm.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a simple test function to verify card creation
CREATE OR REPLACE FUNCTION test_kanban_card_creation(
  p_column_id UUID,
  p_title TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT, card_id UUID) AS $$
DECLARE
  v_card_id UUID;
  v_column_board_id UUID;
  v_board_workspace_id UUID;
  v_user_workspace_role TEXT;
BEGIN
  -- Get the board and workspace for this column
  SELECT b.id, b.workspace_id INTO v_column_board_id, v_board_workspace_id
  FROM kanban_columns c
  JOIN kanban_boards b ON c.board_id = b.id
  WHERE c.id = p_column_id;

  IF v_column_board_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Column not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check user's role in workspace
  SELECT wm.role INTO v_user_workspace_role
  FROM workspace_members wm
  WHERE wm.workspace_id = v_board_workspace_id
    AND wm.user_id = auth.uid();

  IF v_user_workspace_role IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User not a member of workspace'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_user_workspace_role NOT IN ('owner', 'editor') THEN
    RETURN QUERY SELECT FALSE, format('User role "%s" not permitted', v_user_workspace_role)::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Try to create the card
  BEGIN
    INSERT INTO kanban_cards (column_id, title, position, created_by)
    VALUES (p_column_id, p_title, 0, auth.uid())
    RETURNING id INTO v_card_id;

    RETURN QUERY SELECT TRUE, 'Card created successfully'::TEXT, v_card_id;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, format('Error creating card: %s', SQLERRM)::TEXT, NULL::UUID;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create helper view to see RLS policy evaluation status
-- This view shows if current user can create cards in each workspace
CREATE OR REPLACE VIEW kanban_card_creation_access AS
SELECT 
  b.id as board_id,
  b.name as board_name,
  b.workspace_id,
  wm.role,
  (wm.role IN ('owner', 'editor'))::BOOLEAN as can_create_card
FROM kanban_boards b
LEFT JOIN workspace_members wm ON b.workspace_id = wm.workspace_id 
  AND wm.user_id = auth.uid()
ORDER BY b.created_at DESC;

-- To debug, run these queries:
-- SELECT * FROM check_user_workspace_access('YOUR_WORKSPACE_ID_HERE');
-- SELECT * FROM test_kanban_card_creation('YOUR_COLUMN_ID_HERE', 'Test Card');
-- SELECT * FROM kanban_card_creation_access LIMIT 5;
