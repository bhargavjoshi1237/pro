-- Create snippet_comments table
-- Note: user_id references profiles table (not auth.users directly to avoid foreign key issues with Supabase)
CREATE TABLE IF NOT EXISTS snippet_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  line_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_snippet_comments_snippet_id ON snippet_comments(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_comments_user_id ON snippet_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_snippet_comments_line_number ON snippet_comments(line_number);
CREATE INDEX IF NOT EXISTS idx_snippet_comments_created_at ON snippet_comments(created_at);

-- Enable Row Level Security
ALTER TABLE snippet_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "snippet_comments_select" ON snippet_comments;
DROP POLICY IF EXISTS "snippet_comments_insert" ON snippet_comments;
DROP POLICY IF EXISTS "snippet_comments_update" ON snippet_comments;
DROP POLICY IF EXISTS "snippet_comments_delete" ON snippet_comments;

-- RLS Policies for snippet_comments
-- Users can view comments on snippets in their workspaces
CREATE POLICY "snippet_comments_select"
  ON snippet_comments
  FOR SELECT
  USING (
    snippet_id IN (
      SELECT id FROM snippets 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create comments on snippets in their workspaces
CREATE POLICY "snippet_comments_insert"
  ON snippet_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND snippet_id IN (
      SELECT id FROM snippets 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update their own comments
CREATE POLICY "snippet_comments_update"
  ON snippet_comments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "snippet_comments_delete"
  ON snippet_comments
  FOR DELETE
  USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_snippet_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_snippet_comments_updated_at_trigger ON snippet_comments;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_snippet_comments_updated_at_trigger
  BEFORE UPDATE ON snippet_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_snippet_comments_updated_at();

-- Enable realtime for snippet_comments (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'snippet_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE snippet_comments;
  END IF;
END $$;
