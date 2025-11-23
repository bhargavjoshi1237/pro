-- Kanban Card Entities (Many-to-Many)
CREATE TABLE IF NOT EXISTS kanban_card_entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES kanban_cards(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID REFERENCES workspace_entities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(card_id, entity_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kanban_card_entities_card_id ON kanban_card_entities(card_id);
CREATE INDEX IF NOT EXISTS idx_kanban_card_entities_entity_id ON kanban_card_entities(entity_id);

-- Enable RLS
ALTER TABLE kanban_card_entities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "kanban_card_entities_select" ON kanban_card_entities;
CREATE POLICY "kanban_card_entities_select" ON kanban_card_entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kanban_cards c
      JOIN kanban_columns col ON c.column_id = col.id
      JOIN kanban_boards b ON col.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_card_entities.card_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "kanban_card_entities_insert" ON kanban_card_entities;
CREATE POLICY "kanban_card_entities_insert" ON kanban_card_entities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kanban_cards c
      JOIN kanban_columns col ON c.column_id = col.id
      JOIN kanban_boards b ON col.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_card_entities.card_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "kanban_card_entities_delete" ON kanban_card_entities;
CREATE POLICY "kanban_card_entities_delete" ON kanban_card_entities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM kanban_cards c
      JOIN kanban_columns col ON c.column_id = col.id
      JOIN kanban_boards b ON col.board_id = b.id
      JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = kanban_card_entities.card_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'kanban_card_entities') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kanban_card_entities;
  END IF;
END $$;
