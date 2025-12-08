-- ============================================
-- ALTERNATIVE: Relaxed Kanban RLS Policies
-- ============================================
-- If you're still having issues with card creation, you can try these more lenient policies
-- These policies allow any workspace member (not just owner/editor) to create cards
-- This is useful for debugging to see if the issue is RLS permissions or something else

-- WARNING: This is less secure - use only for testing/debugging

-- Cards - Allow any workspace member to create cards
DROP POLICY IF EXISTS "kanban_cards_insert" ON kanban_cards;
CREATE POLICY "kanban_cards_insert" ON kanban_cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kanban_columns c
      JOIN kanban_boards b ON c.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_cards.column_id
      AND wm.user_id = auth.uid()
      -- Removed role check - allow any member to create
    )
  );

-- Card Tags - Allow any workspace member to add tags
DROP POLICY IF EXISTS "kanban_card_tags_insert" ON kanban_card_tags;
CREATE POLICY "kanban_card_tags_insert" ON kanban_card_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kanban_cards c
      JOIN kanban_columns col ON c.column_id = col.id
      JOIN kanban_boards b ON col.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_card_tags.card_id
      AND wm.user_id = auth.uid()
      -- Removed role check
    )
  );

-- If card creation works with these policies, the issue is the role check
-- Then revert to stricter policies and investigate workspace_members roles

-- To revert to strict policies, re-run the original kanban-migration.sql
