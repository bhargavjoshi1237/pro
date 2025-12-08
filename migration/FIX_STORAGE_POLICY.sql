-- ============================================
-- STORAGE BUCKET FIX - Complete Solution
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Ensure bucket exists and is PUBLIC
-- Go to Storage → workspace-assets → Settings
-- Make sure "Public bucket" is ENABLED (toggle ON)
-- Or run this to make it public:
UPDATE storage.buckets 
SET public = true 
WHERE id = 'workspace-assets';

-- STEP 2: Drop all existing policies
DROP POLICY IF EXISTS "Workspace members can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to workspace assets" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can delete assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload workspace assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete workspace assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update workspace assets" ON storage.objects;

-- STEP 3: Create simple, permissive policies
-- 1. Allow any authenticated user to upload
CREATE POLICY "Authenticated users can upload workspace assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workspace-assets');

-- 2. Allow public read access (CRITICAL - needed for displaying images)
CREATE POLICY "Public read access to workspace assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workspace-assets');

-- 3. Allow users to update their own uploads
CREATE POLICY "Authenticated users can update workspace assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'workspace-assets' AND auth.uid() = owner);

-- 4. Allow users to delete their own uploads
CREATE POLICY "Authenticated users can delete workspace assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'workspace-assets' AND auth.uid() = owner);

-- STEP 4: Verify bucket is public
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'workspace-assets';
-- Should show: public = true

-- STEP 5: Verify policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN roles = '{public}' THEN 'public'
    WHEN roles = '{authenticated}' THEN 'authenticated'
    ELSE roles::text
  END as roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%workspace assets%'
ORDER BY policyname;
-- Should show 4 policies

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If images still don't show, check:
-- 1. Bucket is public: SELECT public FROM storage.buckets WHERE id = 'workspace-assets';
-- 2. Files exist: SELECT name, created_at FROM storage.objects WHERE bucket_id = 'workspace-assets' LIMIT 5;
-- 3. Public URL format: https://[project-ref].supabase.co/storage/v1/object/public/workspace-assets/covers/[filename]
