-- ============================================
-- MASTER DATABASE MIGRATION FOR NOVEL SNIPPETS
-- This file will completely reset and rebuild the database
-- Run this in Supabase SQL Editor
-- ============================================

-- WARNING: This will delete ALL existing data!
-- Make sure you have backups if needed

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES AND POLICIES
-- ============================================

-- Drop all policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on public schema tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    -- Drop all policies on storage.objects
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_id_by_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_owner(UUID) CASCADE;

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS snippets CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop storage bucket
DELETE FROM storage.buckets WHERE id = 'avatars';

-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  auto_save BOOLEAN DEFAULT true,
  auto_save_delay INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace members table (for sharing)
CREATE TABLE workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')) NOT NULL DEFAULT 'editor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Folders table
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Snippets table
CREATE TABLE snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  word_count INTEGER DEFAULT 0,
  is_final BOOLEAN DEFAULT false,
  draft_id UUID REFERENCES snippets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_folders_workspace_id ON folders(workspace_id);
CREATE INDEX idx_snippets_folder_id ON snippets(folder_id);
CREATE INDEX idx_snippets_workspace_id ON snippets(workspace_id);
CREATE INDEX idx_snippets_updated_at ON snippets(updated_at DESC);
CREATE INDEX idx_snippets_draft_id ON snippets(draft_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to handle new user creation (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Function to get user ID by email (for sharing workspaces)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(user_email);
END;
$$;

-- ============================================
-- STEP 6: CREATE TRIGGERS
-- ============================================

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 7: CREATE RLS POLICIES
-- ============================================

-- PROFILES POLICIES
-- Anyone can view profiles (for displaying member info)
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- USER PREFERENCES POLICIES
-- Users can view their own preferences
CREATE POLICY "preferences_select_own"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "preferences_insert_own"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "preferences_update_own"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- WORKSPACES POLICIES
-- Disable RLS on workspaces - access control is handled via workspace_members
-- Users will query workspaces through workspace_members join
CREATE POLICY "workspaces_select_all"
  ON workspaces FOR SELECT
  USING (true);

-- Users can create workspaces
CREATE POLICY "workspaces_insert"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Workspace owners can update their workspaces
CREATE POLICY "workspaces_update"
  ON workspaces FOR UPDATE
  USING (auth.uid() = owner_id);

-- Workspace owners can delete their workspaces
CREATE POLICY "workspaces_delete"
  ON workspaces FOR DELETE
  USING (auth.uid() = owner_id);

-- WORKSPACE MEMBERS POLICIES
-- Users can view memberships for workspaces they own or are members of
CREATE POLICY "members_select"
  ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()
    )
  );

-- Workspace owners can add members
CREATE POLICY "members_insert"
  ON workspace_members FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Workspace owners can update members
CREATE POLICY "members_update"
  ON workspace_members FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Workspace owners can remove members
CREATE POLICY "members_delete"
  ON workspace_members FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- FOLDERS POLICIES
-- Users can view folders in workspaces they have access to
CREATE POLICY "folders_select"
  ON folders FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Users with editor/owner role can create folders
CREATE POLICY "folders_insert"
  ON folders FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Users with editor/owner role can update folders
CREATE POLICY "folders_update"
  ON folders FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Users with editor/owner role can delete folders
CREATE POLICY "folders_delete"
  ON folders FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- SNIPPETS POLICIES
-- Users can view snippets in workspaces they have access to
CREATE POLICY "snippets_select"
  ON snippets FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Users with editor/owner role can create snippets
CREATE POLICY "snippets_insert"
  ON snippets FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Users with editor/owner role can update snippets
CREATE POLICY "snippets_update"
  ON snippets FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Users with editor/owner role can delete snippets
CREATE POLICY "snippets_delete"
  ON snippets FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- ============================================
-- STEP 8: CREATE STORAGE BUCKET FOR AVATARS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "avatars_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- STEP 9: GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;

-- ============================================
-- STEP 10: POPULATE PROFILES FOR EXISTING USERS
-- ============================================

-- Create profiles for any existing users who don't have one
INSERT INTO public.profiles (id, email, display_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1))
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- Database structure:
-- 
-- 1. profiles - User profile information
-- 2. user_preferences - User settings (theme, auto-save, etc.)
-- 3. workspaces - Writing project workspaces
-- 4. workspace_members - Workspace sharing and permissions
-- 5. folders - Organization within workspaces
-- 6. snippets - Writing content with draft/final versions
-- 7. storage.avatars - User avatar images
--
-- Key features:
-- - Automatic profile creation on user signup
-- - Workspace sharing with roles (owner, editor, viewer)
-- - Folder organization
-- - Draft and final version management
-- - Avatar storage
-- - Full RLS security
-- ============================================
