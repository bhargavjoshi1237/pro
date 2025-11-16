-- ============================================
-- ENHANCED FEATURES MIGRATION
-- Tags, Notifications, Chat, Presence, and More
-- ============================================

-- ============================================
-- STEP 1: CREATE TAGS SYSTEM
-- ============================================

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Default blue color
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, workspace_id)
);

-- Workspace tags pivot table
CREATE TABLE IF NOT EXISTS workspace_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, tag_id)
);

-- Snippet tags pivot table
CREATE TABLE IF NOT EXISTS snippet_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(snippet_id, tag_id)
);

-- Indexes for tags
CREATE INDEX idx_tags_workspace_id ON tags(workspace_id);
CREATE INDEX idx_workspace_tags_workspace_id ON workspace_tags(workspace_id);
CREATE INDEX idx_workspace_tags_tag_id ON workspace_tags(tag_id);
CREATE INDEX idx_snippet_tags_snippet_id ON snippet_tags(snippet_id);
CREATE INDEX idx_snippet_tags_tag_id ON snippet_tags(tag_id);

-- Enable RLS on tags tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_tags ENABLE ROW LEVEL SECURITY;

-- Tags RLS Policies
CREATE POLICY "tags_select" ON tags FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "tags_insert" ON tags FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "tags_update" ON tags FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "tags_delete" ON tags FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Workspace tags RLS Policies
CREATE POLICY "workspace_tags_select" ON workspace_tags FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace_tags_insert" ON workspace_tags FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "workspace_tags_delete" ON workspace_tags FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Snippet tags RLS Policies
CREATE POLICY "snippet_tags_select" ON snippet_tags FOR SELECT
  USING (snippet_id IN (SELECT id FROM snippets WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

CREATE POLICY "snippet_tags_insert" ON snippet_tags FOR INSERT
  WITH CHECK (snippet_id IN (SELECT id FROM snippets WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))));

CREATE POLICY "snippet_tags_delete" ON snippet_tags FOR DELETE
  USING (snippet_id IN (SELECT id FROM snippets WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))));

-- ============================================
-- STEP 2: CREATE NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mention', 'comment', 'share', 'edit', 'chat', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL to navigate to when clicked
  read BOOLEAN DEFAULT false,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS Policies
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (true); -- Anyone can create notifications for others

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 3: CREATE CHAT SYSTEM
-- ============================================

-- Chat rooms (for one-to-one and workspace chats)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('direct', 'workspace')),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat room members
CREATE TABLE IF NOT EXISTS chat_room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mentions UUID[], -- Array of user IDs mentioned
  edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_rooms_workspace_id ON chat_rooms(workspace_id);
CREATE INDEX idx_chat_room_members_room_id ON chat_room_members(room_id);
CREATE INDEX idx_chat_room_members_user_id ON chat_room_members(user_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat RLS Policies
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT
  USING (id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "chat_rooms_insert" ON chat_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "chat_room_members_select" ON chat_room_members FOR SELECT
  USING (user_id = auth.uid() OR room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "chat_room_members_insert" ON chat_room_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "chat_room_members_update_own" ON chat_room_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT
  USING (room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT
  WITH CHECK (room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "chat_messages_update_own" ON chat_messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "chat_messages_delete_own" ON chat_messages FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- STEP 4: ENHANCE PRESENCE SYSTEM
-- ============================================

-- Update active_sessions if it exists, or create it
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE,
  cursor_position INTEGER DEFAULT 0,
  selection_start INTEGER,
  selection_end INTEGER,
  color TEXT NOT NULL,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- Add status column if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='active_sessions' AND column_name='status') THEN
    ALTER TABLE active_sessions ADD COLUMN status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy'));
  END IF;
END $$;

-- ============================================
-- STEP 5: CREATE COMMENTS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  position INTEGER, -- Character position in snippet where comment is attached
  resolved BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threaded replies
  mentions UUID[], -- Array of user IDs mentioned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_snippet_id ON comments(snippet_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON comments FOR SELECT
  USING (snippet_id IN (SELECT id FROM snippets WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

CREATE POLICY "comments_insert" ON comments FOR INSERT
  WITH CHECK (snippet_id IN (SELECT id FROM snippets WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

CREATE POLICY "comments_update_own" ON comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "comments_delete_own" ON comments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- STEP 6: ADD SUBSCRIPTION TIERS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own" ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own" ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 7: ADD WORKSPACE EXPORT METADATA
-- ============================================

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- ============================================
-- STEP 8: ENABLE REALTIME ON NEW TABLES
-- ============================================

-- Enable realtime for all new tables
ALTER PUBLICATION supabase_realtime ADD TABLE tags;
ALTER PUBLICATION supabase_realtime ADD TABLE snippet_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;

-- ============================================
-- STEP 9: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to create or get direct chat room between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  room_id UUID;
BEGIN
  -- Try to find existing direct chat
  SELECT cr.id INTO room_id
  FROM chat_rooms cr
  WHERE cr.type = 'direct'
    AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND user_id = other_user_id)
  LIMIT 1;
  
  -- If not found, create new room
  IF room_id IS NULL THEN
    INSERT INTO chat_rooms (type) VALUES ('direct') RETURNING id INTO room_id;
    INSERT INTO chat_room_members (room_id, user_id) VALUES (room_id, auth.uid());
    INSERT INTO chat_room_members (room_id, user_id) VALUES (room_id, other_user_id);
  END IF;
  
  RETURN room_id;
END;
$$;

-- Function to send notification
CREATE OR REPLACE FUNCTION send_notification(
  to_user_id UUID,
  notif_type TEXT,
  notif_title TEXT,
  notif_message TEXT,
  notif_link TEXT DEFAULT NULL,
  notif_workspace_id UUID DEFAULT NULL,
  notif_snippet_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notif_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, link, workspace_id, snippet_id, from_user_id
  ) VALUES (
    to_user_id, notif_type, notif_title, notif_message, notif_link, notif_workspace_id, notif_snippet_id, auth.uid()
  ) RETURNING id INTO notif_id;
  
  RETURN notif_id;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM notifications
  WHERE user_id = auth.uid() AND read = false;
  
  RETURN count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_direct_chat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_notification(UUID, TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- New features added:
-- 1. Tags system (workspace and snippet tags)
-- 2. Notifications system
-- 3. Chat system (direct and workspace chats)
-- 4. Enhanced presence tracking
-- 5. Comments system with threading
-- 6. Subscription tiers
-- 7. Workspace export metadata
-- 8. Helper functions for common operations
-- ============================================
