-- ============================================
-- PROPER 6K (LINEAR CLONE) MIGRATION
-- ============================================
-- This migration creates all necessary tables for a Linear-style issue tracking system
-- integrated with the existing workspace system.

-- ============================================
-- TABLES
-- ============================================

-- Projects (high-level grouping for issues)
CREATE TABLE IF NOT EXISTS proper6k_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key TEXT NOT NULL, -- Short identifier like "JAC", "PROJ"
  description TEXT,
  icon TEXT, -- Emoji or icon identifier
  color TEXT DEFAULT '#808080',
  lead_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_date DATE,
  status TEXT CHECK (status IN ('planned', 'active', 'paused', 'completed', 'canceled')) DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, key)
);

-- Cycles (sprints/iterations)
CREATE TABLE IF NOT EXISTS proper6k_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Labels (tags for categorizing issues)
CREATE TABLE IF NOT EXISTS proper6k_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#808080',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

-- Issues (core issue tracking)
CREATE TABLE IF NOT EXISTS proper6k_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES proper6k_projects(id) ON DELETE SET NULL,
  cycle_id UUID REFERENCES proper6k_cycles(id) ON DELETE SET NULL,
  
  -- Issue identification
  number INTEGER NOT NULL, -- Auto-incrementing per project
  title TEXT NOT NULL,
  description TEXT,
  
  -- Workflow
  status TEXT CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled')) DEFAULT 'backlog',
  priority TEXT CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent')) DEFAULT 'none',
  
  -- Assignment and dates
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique numbering per project
  UNIQUE(project_id, number)
);

-- Issue Labels (many-to-many)
CREATE TABLE IF NOT EXISTS proper6k_issue_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES proper6k_issues(id) ON DELETE CASCADE NOT NULL,
  label_id UUID REFERENCES proper6k_labels(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(issue_id, label_id)
);

-- Comments on issues
CREATE TABLE IF NOT EXISTS proper6k_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES proper6k_issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issue relationships (blocks, relates to, duplicates)
CREATE TABLE IF NOT EXISTS proper6k_issue_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_issue_id UUID REFERENCES proper6k_issues(id) ON DELETE CASCADE NOT NULL,
  target_issue_id UUID REFERENCES proper6k_issues(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT CHECK (relationship_type IN ('blocks', 'blocked_by', 'relates_to', 'duplicates', 'duplicated_by')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_issue_id, target_issue_id, relationship_type)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_proper6k_projects_workspace_id ON proper6k_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_proper6k_cycles_workspace_id ON proper6k_cycles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_proper6k_labels_workspace_id ON proper6k_labels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_proper6k_issues_workspace_id ON proper6k_issues(workspace_id);
CREATE INDEX IF NOT EXISTS idx_proper6k_issues_project_id ON proper6k_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_proper6k_issues_cycle_id ON proper6k_issues(cycle_id);
CREATE INDEX IF NOT EXISTS idx_proper6k_issues_assignee_id ON proper6k_issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_proper6k_issues_status ON proper6k_issues(status);
CREATE INDEX IF NOT EXISTS idx_proper6k_issues_priority ON proper6k_issues(priority);
CREATE INDEX IF NOT EXISTS idx_proper6k_issue_labels_issue_id ON proper6k_issue_labels(issue_id);
CREATE INDEX IF NOT EXISTS idx_proper6k_issue_labels_label_id ON proper6k_issue_labels(label_id);
CREATE INDEX IF NOT EXISTS idx_proper6k_comments_issue_id ON proper6k_comments(issue_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-increment issue number per project
CREATE OR REPLACE FUNCTION proper6k_set_issue_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.number IS NULL THEN
    SELECT COALESCE(MAX(number), 0) + 1
    INTO NEW.number
    FROM proper6k_issues
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set issue number
DROP TRIGGER IF EXISTS proper6k_issue_number_trigger ON proper6k_issues;
CREATE TRIGGER proper6k_issue_number_trigger
  BEFORE INSERT ON proper6k_issues
  FOR EACH ROW
  EXECUTE FUNCTION proper6k_set_issue_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION proper6k_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS proper6k_projects_updated_at ON proper6k_projects;
CREATE TRIGGER proper6k_projects_updated_at
  BEFORE UPDATE ON proper6k_projects
  FOR EACH ROW
  EXECUTE FUNCTION proper6k_update_updated_at();

DROP TRIGGER IF EXISTS proper6k_cycles_updated_at ON proper6k_cycles;
CREATE TRIGGER proper6k_cycles_updated_at
  BEFORE UPDATE ON proper6k_cycles
  FOR EACH ROW
  EXECUTE FUNCTION proper6k_update_updated_at();

DROP TRIGGER IF EXISTS proper6k_labels_updated_at ON proper6k_labels;
CREATE TRIGGER proper6k_labels_updated_at
  BEFORE UPDATE ON proper6k_labels
  FOR EACH ROW
  EXECUTE FUNCTION proper6k_update_updated_at();

DROP TRIGGER IF EXISTS proper6k_issues_updated_at ON proper6k_issues;
CREATE TRIGGER proper6k_issues_updated_at
  BEFORE UPDATE ON proper6k_issues
  FOR EACH ROW
  EXECUTE FUNCTION proper6k_update_updated_at();

DROP TRIGGER IF EXISTS proper6k_comments_updated_at ON proper6k_comments;
CREATE TRIGGER proper6k_comments_updated_at
  BEFORE UPDATE ON proper6k_comments
  FOR EACH ROW
  EXECUTE FUNCTION proper6k_update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE proper6k_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proper6k_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proper6k_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE proper6k_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE proper6k_issue_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE proper6k_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proper6k_issue_relationships ENABLE ROW LEVEL SECURITY;

-- Projects Policies
DROP POLICY IF EXISTS "proper6k_projects_select" ON proper6k_projects;
CREATE POLICY "proper6k_projects_select" ON proper6k_projects FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "proper6k_projects_insert" ON proper6k_projects;
CREATE POLICY "proper6k_projects_insert" ON proper6k_projects FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "proper6k_projects_update" ON proper6k_projects;
CREATE POLICY "proper6k_projects_update" ON proper6k_projects FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "proper6k_projects_delete" ON proper6k_projects;
CREATE POLICY "proper6k_projects_delete" ON proper6k_projects FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Cycles Policies
DROP POLICY IF EXISTS "proper6k_cycles_select" ON proper6k_cycles;
CREATE POLICY "proper6k_cycles_select" ON proper6k_cycles FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "proper6k_cycles_insert" ON proper6k_cycles;
CREATE POLICY "proper6k_cycles_insert" ON proper6k_cycles FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "proper6k_cycles_update" ON proper6k_cycles;
CREATE POLICY "proper6k_cycles_update" ON proper6k_cycles FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "proper6k_cycles_delete" ON proper6k_cycles;
CREATE POLICY "proper6k_cycles_delete" ON proper6k_cycles FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Labels Policies
DROP POLICY IF EXISTS "proper6k_labels_select" ON proper6k_labels;
CREATE POLICY "proper6k_labels_select" ON proper6k_labels FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "proper6k_labels_insert" ON proper6k_labels;
CREATE POLICY "proper6k_labels_insert" ON proper6k_labels FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "proper6k_labels_update" ON proper6k_labels;
CREATE POLICY "proper6k_labels_update" ON proper6k_labels FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "proper6k_labels_delete" ON proper6k_labels;
CREATE POLICY "proper6k_labels_delete" ON proper6k_labels FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Issues Policies
DROP POLICY IF EXISTS "proper6k_issues_select" ON proper6k_issues;
CREATE POLICY "proper6k_issues_select" ON proper6k_issues FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "proper6k_issues_insert" ON proper6k_issues;
CREATE POLICY "proper6k_issues_insert" ON proper6k_issues FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "proper6k_issues_update" ON proper6k_issues;
CREATE POLICY "proper6k_issues_update" ON proper6k_issues FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

DROP POLICY IF EXISTS "proper6k_issues_delete" ON proper6k_issues;
CREATE POLICY "proper6k_issues_delete" ON proper6k_issues FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Issue Labels Policies
DROP POLICY IF EXISTS "proper6k_issue_labels_select" ON proper6k_issue_labels;
CREATE POLICY "proper6k_issue_labels_select" ON proper6k_issue_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proper6k_issues i
      JOIN workspace_members wm ON i.workspace_id = wm.workspace_id
      WHERE i.id = proper6k_issue_labels.issue_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "proper6k_issue_labels_insert" ON proper6k_issue_labels;
CREATE POLICY "proper6k_issue_labels_insert" ON proper6k_issue_labels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proper6k_issues i
      JOIN workspace_members wm ON i.workspace_id = wm.workspace_id
      WHERE i.id = proper6k_issue_labels.issue_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "proper6k_issue_labels_delete" ON proper6k_issue_labels;
CREATE POLICY "proper6k_issue_labels_delete" ON proper6k_issue_labels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM proper6k_issues i
      JOIN workspace_members wm ON i.workspace_id = wm.workspace_id
      WHERE i.id = proper6k_issue_labels.issue_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

-- Comments Policies
DROP POLICY IF EXISTS "proper6k_comments_select" ON proper6k_comments;
CREATE POLICY "proper6k_comments_select" ON proper6k_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proper6k_issues i
      JOIN workspace_members wm ON i.workspace_id = wm.workspace_id
      WHERE i.id = proper6k_comments.issue_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "proper6k_comments_insert" ON proper6k_comments;
CREATE POLICY "proper6k_comments_insert" ON proper6k_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM proper6k_issues i
      JOIN workspace_members wm ON i.workspace_id = wm.workspace_id
      WHERE i.id = proper6k_comments.issue_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "proper6k_comments_update" ON proper6k_comments;
CREATE POLICY "proper6k_comments_update" ON proper6k_comments FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "proper6k_comments_delete" ON proper6k_comments;
CREATE POLICY "proper6k_comments_delete" ON proper6k_comments FOR DELETE
  USING (user_id = auth.uid());

-- Issue Relationships Policies
DROP POLICY IF EXISTS "proper6k_issue_relationships_select" ON proper6k_issue_relationships;
CREATE POLICY "proper6k_issue_relationships_select" ON proper6k_issue_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proper6k_issues i
      JOIN workspace_members wm ON i.workspace_id = wm.workspace_id
      WHERE (i.id = proper6k_issue_relationships.source_issue_id OR i.id = proper6k_issue_relationships.target_issue_id)
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "proper6k_issue_relationships_insert" ON proper6k_issue_relationships;
CREATE POLICY "proper6k_issue_relationships_insert" ON proper6k_issue_relationships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proper6k_issues i
      JOIN workspace_members wm ON i.workspace_id = wm.workspace_id
      WHERE i.id = proper6k_issue_relationships.source_issue_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "proper6k_issue_relationships_delete" ON proper6k_issue_relationships;
CREATE POLICY "proper6k_issue_relationships_delete" ON proper6k_issue_relationships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM proper6k_issues i
      JOIN workspace_members wm ON i.workspace_id = wm.workspace_id
      WHERE i.id = proper6k_issue_relationships.source_issue_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
    )
  );

-- ============================================
-- REALTIME
-- ============================================

DO $$
BEGIN
  -- proper6k_projects
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proper6k_projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE proper6k_projects;
  END IF;

  -- proper6k_cycles
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proper6k_cycles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE proper6k_cycles;
  END IF;

  -- proper6k_labels
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proper6k_labels') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE proper6k_labels;
  END IF;

  -- proper6k_issues
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proper6k_issues') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE proper6k_issues;
  END IF;

  -- proper6k_issue_labels
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proper6k_issue_labels') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE proper6k_issue_labels;
  END IF;

  -- proper6k_comments
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proper6k_comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE proper6k_comments;
  END IF;

  -- proper6k_issue_relationships
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proper6k_issue_relationships') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE proper6k_issue_relationships;
  END IF;
END $$;
