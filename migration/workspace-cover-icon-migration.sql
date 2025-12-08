-- Add cover_image and icon fields to workspaces table
-- This allows workspaces to have custom cover images and icons

-- Add columns to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add comment for documentation
COMMENT ON COLUMN workspaces.cover_image IS 'URL or path to workspace cover image shown in dashboard';
COMMENT ON COLUMN workspaces.icon IS 'Icon identifier from Heroicons library';

-- No additional indexes needed as these are display-only fields
-- RLS policies remain unchanged as they inherit from workspaces table policies

-- Storage bucket and policies for workspace assets
-- Create storage bucket (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('workspace-assets', 'workspace-assets', true, 5242880);

-- Storage policies - Simple and permissive for authenticated users
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Workspace members can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to workspace assets" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can delete assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload workspace assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete workspace assets" ON storage.objects;

-- Allow any authenticated user to upload to workspace-assets bucket
CREATE POLICY "Authenticated users can upload workspace assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workspace-assets');

-- Allow public read access
CREATE POLICY "Public read access to workspace assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workspace-assets');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete workspace assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'workspace-assets' AND auth.uid() = owner);
