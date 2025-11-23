-- ============================================
-- MIGRATION: ADD ENTITIES AND TAGS (FIXED RLS)
-- ============================================

-- 1. Workspace Entities Table
CREATE TABLE IF NOT EXISTS workspace_entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('character', 'location', 'item', 'lore', 'subplot', 'other')),
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Workspace Tags Table
CREATE TABLE IF NOT EXISTS workspace_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#808080',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

-- 3. Snippet Entities Junction Table
CREATE TABLE IF NOT EXISTS snippet_entities (
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID REFERENCES workspace_entities(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (snippet_id, entity_id)
);

-- 4. Snippet Tags Junction Table
CREATE TABLE IF NOT EXISTS snippet_workspace_tags (
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES workspace_tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (snippet_id, tag_id)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_entities_workspace_id ON workspace_entities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_entities_type ON workspace_entities(type);
CREATE INDEX IF NOT EXISTS idx_workspace_tags_workspace_id ON workspace_tags(workspace_id);
CREATE INDEX IF NOT EXISTS idx_snippet_entities_snippet_id ON snippet_entities(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_entities_entity_id ON snippet_entities(entity_id);
CREATE INDEX IF NOT EXISTS idx_snippet_workspace_tags_snippet_id ON snippet_workspace_tags(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_workspace_tags_tag_id ON snippet_workspace_tags(tag_id);

-- 6. RLS Policies (Updated to explicitly include Workspace Owner)

-- Enable RLS
ALTER TABLE workspace_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_workspace_tags ENABLE ROW LEVEL SECURITY;

-- Workspace Entities Policies
DROP POLICY IF EXISTS "entities_select" ON workspace_entities;
CREATE POLICY "entities_select"
  ON workspace_entities FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "entities_insert" ON workspace_entities;
CREATE POLICY "entities_insert"
  ON workspace_entities FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "entities_update" ON workspace_entities;
CREATE POLICY "entities_update"
  ON workspace_entities FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "entities_delete" ON workspace_entities;
CREATE POLICY "entities_delete"
  ON workspace_entities FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Workspace Tags Policies
DROP POLICY IF EXISTS "tags_select" ON workspace_tags;
CREATE POLICY "tags_select"
  ON workspace_tags FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tags_insert" ON workspace_tags;
CREATE POLICY "tags_insert"
  ON workspace_tags FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "tags_update" ON workspace_tags;
CREATE POLICY "tags_update"
  ON workspace_tags FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "tags_delete" ON workspace_tags;
CREATE POLICY "tags_delete"
  ON workspace_tags FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Snippet Entities Policies
DROP POLICY IF EXISTS "snippet_entities_select" ON snippet_entities;
CREATE POLICY "snippet_entities_select"
  ON snippet_entities FOR SELECT
  USING (
    snippet_id IN (
      SELECT id FROM snippets WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "snippet_entities_insert" ON snippet_entities;
CREATE POLICY "snippet_entities_insert"
  ON snippet_entities FOR INSERT
  WITH CHECK (
    snippet_id IN (
      SELECT id FROM snippets WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      )
    )
  );

DROP POLICY IF EXISTS "snippet_entities_delete" ON snippet_entities;
CREATE POLICY "snippet_entities_delete"
  ON snippet_entities FOR DELETE
  USING (
    snippet_id IN (
      SELECT id FROM snippets WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      )
    )
  );

-- Snippet Tags Policies
DROP POLICY IF EXISTS "snippet_tags_select" ON snippet_workspace_tags;
CREATE POLICY "snippet_tags_select"
  ON snippet_workspace_tags FOR SELECT
  USING (
    snippet_id IN (
      SELECT id FROM snippets WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "snippet_tags_insert" ON snippet_workspace_tags;
CREATE POLICY "snippet_tags_insert"
  ON snippet_workspace_tags FOR INSERT
  WITH CHECK (
    snippet_id IN (
      SELECT id FROM snippets WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      )
    )
  );

DROP POLICY IF EXISTS "snippet_tags_delete" ON snippet_workspace_tags;
CREATE POLICY "snippet_tags_delete"
  ON snippet_workspace_tags FOR DELETE
  USING (
    snippet_id IN (
      SELECT id FROM snippets WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      )
    )
  );
