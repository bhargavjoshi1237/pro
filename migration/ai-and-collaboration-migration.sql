-- ============================================
-- AI ASSISTANT & REAL-TIME COLLABORATION MIGRATION
-- Adds AI chat history, settings, and Y.js support
-- ============================================

-- ============================================
-- STEP 1: ADD AI SETTINGS TO PROFILES
-- ============================================

-- Add ai_settings column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{}'::jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_ai_settings ON profiles USING gin(ai_settings);

-- ============================================
-- STEP 2: CREATE AI CHAT HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for chat history
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_created_at ON ai_chat_history(created_at DESC);

-- Enable RLS on ai_chat_history
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_chat_history
CREATE POLICY "ai_chat_history_select" ON ai_chat_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "ai_chat_history_insert" ON ai_chat_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_chat_history_delete" ON ai_chat_history FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- STEP 3: ADD Y.JS STATE TO SNIPPETS
-- ============================================

-- Add yjs_state column to snippets for collaborative editing
ALTER TABLE snippets 
ADD COLUMN IF NOT EXISTS yjs_state BYTEA;

-- Add last_edited_by to track who made the last change
ALTER TABLE snippets 
ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add last_edited_at timestamp
ALTER TABLE snippets 
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_snippets_last_edited_at ON snippets(last_edited_at DESC);

-- ============================================
-- STEP 4: CREATE SNIPPET VERSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS snippet_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  yjs_state BYTEA,
  version_number INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  word_count INTEGER DEFAULT 0,
  char_count INTEGER DEFAULT 0
);

-- Indexes for versions
CREATE INDEX IF NOT EXISTS idx_snippet_versions_snippet_id ON snippet_versions(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_versions_created_at ON snippet_versions(created_at DESC);

-- Enable RLS on snippet_versions
ALTER TABLE snippet_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for snippet_versions
CREATE POLICY "snippet_versions_select" ON snippet_versions FOR SELECT
  USING (snippet_id IN (
    SELECT id FROM snippets WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "snippet_versions_insert" ON snippet_versions FOR INSERT
  WITH CHECK (snippet_id IN (
    SELECT id FROM snippets WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  ));

CREATE POLICY "snippet_versions_delete" ON snippet_versions FOR DELETE
  USING (snippet_id IN (
    SELECT id FROM snippets WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  ));

-- ============================================
-- STEP 5: CREATE FUNCTION TO AUTO-VERSION SNIPPETS
-- ============================================

CREATE OR REPLACE FUNCTION create_snippet_version()
RETURNS TRIGGER AS $$
DECLARE
  latest_version INTEGER;
BEGIN
  -- Get the latest version number
  SELECT COALESCE(MAX(version_number), 0) INTO latest_version
  FROM snippet_versions
  WHERE snippet_id = NEW.id;

  -- Create a new version if content changed
  IF (TG_OP = 'UPDATE' AND OLD.content IS DISTINCT FROM NEW.content) THEN
    INSERT INTO snippet_versions (
      snippet_id,
      content,
      yjs_state,
      version_number,
      created_by,
      word_count,
      char_count
    ) VALUES (
      NEW.id,
      NEW.content,
      NEW.yjs_state,
      latest_version + 1,
      NEW.last_edited_by,
      NEW.word_count,
      NEW.char_count
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-versioning
DROP TRIGGER IF EXISTS snippet_version_trigger ON snippets;
CREATE TRIGGER snippet_version_trigger
  AFTER UPDATE ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION create_snippet_version();

-- ============================================
-- STEP 6: ENABLE REALTIME FOR NEW TABLES
-- ============================================

-- Enable realtime for ai_chat_history
ALTER PUBLICATION supabase_realtime ADD TABLE ai_chat_history;

-- Enable realtime for snippet_versions
ALTER PUBLICATION supabase_realtime ADD TABLE snippet_versions;

-- ============================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get version history for a snippet
CREATE OR REPLACE FUNCTION get_snippet_versions(snippet_uuid UUID)
RETURNS TABLE (
  id UUID,
  version_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  description TEXT,
  word_count INTEGER,
  char_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sv.id,
    sv.version_number,
    sv.created_at,
    sv.created_by,
    sv.description,
    sv.word_count,
    sv.char_count
  FROM snippet_versions sv
  WHERE sv.snippet_id = snippet_uuid
  ORDER BY sv.version_number DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a snippet version
CREATE OR REPLACE FUNCTION restore_snippet_version(version_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  version_record RECORD;
BEGIN
  -- Get the version data
  SELECT * INTO version_record
  FROM snippet_versions
  WHERE id = version_uuid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Update the snippet with the version data
  UPDATE snippets
  SET 
    content = version_record.content,
    yjs_state = version_record.yjs_state,
    last_edited_by = auth.uid(),
    last_edited_at = NOW()
  WHERE id = version_record.snippet_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old AI chat history (keep last 100 messages per user)
CREATE OR REPLACE FUNCTION cleanup_old_ai_chat()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_chat_history
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM ai_chat_history
    ) t
    WHERE rn > 100
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 8: ADD WORD/CHAR COUNT TO SNIPPETS
-- ============================================

-- Add word_count and char_count if they don't exist
ALTER TABLE snippets 
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

ALTER TABLE snippets 
ADD COLUMN IF NOT EXISTS char_count INTEGER DEFAULT 0;

-- Create function to update word/char count
CREATE OR REPLACE FUNCTION update_snippet_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate word count (split by whitespace)
  NEW.word_count := array_length(regexp_split_to_array(trim(NEW.content), '\s+'), 1);
  
  -- Calculate character count
  NEW.char_count := length(NEW.content);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating counts
DROP TRIGGER IF EXISTS snippet_counts_trigger ON snippets;
CREATE TRIGGER snippet_counts_trigger
  BEFORE INSERT OR UPDATE OF content ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION update_snippet_counts();

-- ============================================
-- STEP 9: GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_snippet_versions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_snippet_version(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_ai_chat() TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- ✅ Added AI settings to profiles
-- ✅ Created AI chat history table
-- ✅ Added Y.js state support to snippets
-- ✅ Created snippet versions table with auto-versioning
-- ✅ Added word/char count tracking
-- ✅ Created helper functions for version management
-- ✅ Enabled realtime for new tables
-- ✅ Set up RLS policies for security

-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Enable realtime in Supabase Dashboard for new tables
-- 3. Configure OpenAI API key in user settings
-- 4. Test collaborative editing with multiple users
-- 5. Test AI chat functionality
