-- ============================================
-- NOTES BOARDS FEATURE MIGRATION
-- Mila Notes-like collaborative board
-- Add this to your Supabase SQL Editor
-- ============================================

-- Create notes_boards table
CREATE TABLE IF NOT EXISTS notes_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Board',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create notes_items table (sticky notes, text cards, images, etc.)
CREATE TABLE IF NOT EXISTS notes_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES notes_boards(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'sticky', 'text', 'image', 'link', 'shape'
  content JSONB NOT NULL DEFAULT '{}', -- Flexible content storage
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT DEFAULT 200,
  height FLOAT DEFAULT 200,
  z_index INTEGER DEFAULT 0,
  style JSONB DEFAULT '{}', -- Color, font, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create notes_connections table (lines between items)
CREATE TABLE IF NOT EXISTS notes_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES notes_boards(id) ON DELETE CASCADE NOT NULL,
  source_id UUID REFERENCES notes_items(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES notes_items(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'default', -- 'default', 'step', 'smooth'
  style JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notes_boards_workspace_id ON notes_boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_items_board_id ON notes_items(board_id);
CREATE INDEX IF NOT EXISTS idx_notes_connections_board_id ON notes_connections(board_id);

-- Enable RLS
ALTER TABLE notes_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes_boards
CREATE POLICY "notes_boards_select"
  ON notes_boards FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "notes_boards_insert"
  ON notes_boards FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "notes_boards_update"
  ON notes_boards FOR UPDATE
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "notes_boards_delete"
  ON notes_boards FOR DELETE
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

-- RLS Policies for notes_items
CREATE POLICY "notes_items_select"
  ON notes_items FOR SELECT
  USING (
    board_id IN (
      SELECT nb.id FROM notes_boards nb
      WHERE nb.workspace_id IN (
        SELECT wm.workspace_id 
        FROM workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "notes_items_insert"
  ON notes_items FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT nb.id FROM notes_boards nb
      WHERE nb.workspace_id IN (
        SELECT wm.workspace_id 
        FROM workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "notes_items_update"
  ON notes_items FOR UPDATE
  USING (
    board_id IN (
      SELECT nb.id FROM notes_boards nb
      WHERE nb.workspace_id IN (
        SELECT wm.workspace_id 
        FROM workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "notes_items_delete"
  ON notes_items FOR DELETE
  USING (
    board_id IN (
      SELECT nb.id FROM notes_boards nb
      WHERE nb.workspace_id IN (
        SELECT wm.workspace_id 
        FROM workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );

-- RLS Policies for notes_connections
CREATE POLICY "notes_connections_select"
  ON notes_connections FOR SELECT
  USING (
    board_id IN (
      SELECT nb.id FROM notes_boards nb
      WHERE nb.workspace_id IN (
        SELECT wm.workspace_id 
        FROM workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "notes_connections_insert"
  ON notes_connections FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT nb.id FROM notes_boards nb
      WHERE nb.workspace_id IN (
        SELECT wm.workspace_id 
        FROM workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "notes_connections_delete"
  ON notes_connections FOR DELETE
  USING (
    board_id IN (
      SELECT nb.id FROM notes_boards nb
      WHERE nb.workspace_id IN (
        SELECT wm.workspace_id 
        FROM workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );

-- Add notes_board_id to active_sessions for tracking active users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_sessions' AND column_name = 'notes_board_id') THEN
        ALTER TABLE active_sessions ADD COLUMN notes_board_id UUID REFERENCES notes_boards(id) ON DELETE CASCADE;
        CREATE INDEX idx_active_sessions_notes_board_id ON active_sessions(notes_board_id);
    END IF;
END $$;

-- Enable realtime for all notes tables
ALTER PUBLICATION supabase_realtime ADD TABLE notes_boards;
ALTER PUBLICATION supabase_realtime ADD TABLE notes_items;
ALTER PUBLICATION supabase_realtime ADD TABLE notes_connections;

-- Update trigger for notes_boards
CREATE OR REPLACE FUNCTION update_notes_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_boards_updated_at
    BEFORE UPDATE ON notes_boards
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_boards_updated_at();

-- Update trigger for notes_items
CREATE OR REPLACE FUNCTION update_notes_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_items_updated_at
    BEFORE UPDATE ON notes_items
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_items_updated_at();
