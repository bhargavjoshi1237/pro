-- ============================================
-- KANBAN SYSTEM MIGRATION
-- ============================================

-- Kanban Boards
CREATE TABLE IF NOT EXISTS kanban_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kanban Columns
CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kanban Cards
CREATE TABLE IF NOT EXISTS kanban_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID REFERENCES kanban_columns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS kanban_card_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES kanban_cards(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(card_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kanban_boards_workspace_id ON kanban_boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON kanban_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_assignee_id ON kanban_cards(assignee_id);
CREATE INDEX IF NOT EXISTS idx_kanban_card_tags_card_id ON kanban_card_tags(card_id);

-- Enable RLS
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_card_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Boards
DROP POLICY IF EXISTS "kanban_boards_select" ON kanban_boards;
CREATE POLICY "kanban_boards_select" ON kanban_boards FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "kanban_boards_insert" ON kanban_boards;
CREATE POLICY "kanban_boards_insert" ON kanban_boards FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "kanban_boards_update" ON kanban_boards;
CREATE POLICY "kanban_boards_update" ON kanban_boards FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "kanban_boards_delete" ON kanban_boards;
CREATE POLICY "kanban_boards_delete" ON kanban_boards FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Columns
DROP POLICY IF EXISTS "kanban_columns_select" ON kanban_columns;
CREATE POLICY "kanban_columns_select" ON kanban_columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kanban_boards b
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE b.id = kanban_columns.board_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "kanban_columns_insert" ON kanban_columns;
CREATE POLICY "kanban_columns_insert" ON kanban_columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kanban_boards b
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE b.id = kanban_columns.board_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "kanban_columns_update" ON kanban_columns;
CREATE POLICY "kanban_columns_update" ON kanban_columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM kanban_boards b
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE b.id = kanban_columns.board_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "kanban_columns_delete" ON kanban_columns;
CREATE POLICY "kanban_columns_delete" ON kanban_columns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM kanban_boards b
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE b.id = kanban_columns.board_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

-- Cards
DROP POLICY IF EXISTS "kanban_cards_select" ON kanban_cards;
CREATE POLICY "kanban_cards_select" ON kanban_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kanban_columns c
      JOIN kanban_boards b ON c.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_cards.column_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "kanban_cards_insert" ON kanban_cards;
CREATE POLICY "kanban_cards_insert" ON kanban_cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kanban_columns c
      JOIN kanban_boards b ON c.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_cards.column_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "kanban_cards_update" ON kanban_cards;
CREATE POLICY "kanban_cards_update" ON kanban_cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM kanban_columns c
      JOIN kanban_boards b ON c.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_cards.column_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "kanban_cards_delete" ON kanban_cards;
CREATE POLICY "kanban_cards_delete" ON kanban_cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM kanban_columns c
      JOIN kanban_boards b ON c.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_cards.column_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

-- Card Tags
DROP POLICY IF EXISTS "kanban_card_tags_select" ON kanban_card_tags;
CREATE POLICY "kanban_card_tags_select" ON kanban_card_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kanban_cards c
      JOIN kanban_columns col ON c.column_id = col.id
      JOIN kanban_boards b ON col.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_card_tags.card_id
      AND wm.user_id = auth.uid()
    )
  );

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
      AND wm.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "kanban_card_tags_delete" ON kanban_card_tags;
CREATE POLICY "kanban_card_tags_delete" ON kanban_card_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM kanban_cards c
      JOIN kanban_columns col ON c.column_id = col.id
      JOIN kanban_boards b ON col.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_card_tags.card_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

-- Realtime
DO $$
BEGIN
  -- kanban_boards
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'kanban_boards') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kanban_boards;
  END IF;

  -- kanban_columns
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'kanban_columns') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kanban_columns;
  END IF;

  -- kanban_cards
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'kanban_cards') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kanban_cards;
  END IF;

  -- kanban_card_tags
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'kanban_card_tags') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kanban_card_tags;
  END IF;
END $$;
