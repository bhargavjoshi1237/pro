-- ============================================
-- COMPLETE FIX - Run this entire script
-- Copy and paste into Supabase SQL Editor
-- Then click "Run"
-- ============================================

-- ============================================
-- PART 1: Create Database Columns
-- ============================================

ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add helpful comments
COMMENT ON COLUMN workspaces.cover_image IS 'Public URL to workspace cover image';
COMMENT ON COLUMN workspaces.icon IS 'Icon ID from Heroicons (e.g., rocket, document, code)';

-- ============================================
-- PART 2: Make Storage Bucket Public
-- ============================================

-- Update bucket to be public (needed for displaying images)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'workspace-assets';

-- ============================================
-- PART 3: Create Storage Policies
-- ============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Workspace members can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to workspace assets" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can delete assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload workspace assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete workspace assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update workspace assets" ON storage.objects;

-- Create new policies
CREATE POLICY "Authenticated users can upload workspace assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workspace-assets');

CREATE POLICY "Public read access to workspace assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workspace-assets');

CREATE POLICY "Authenticated users can update workspace assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'workspace-assets' AND auth.uid() = owner);

CREATE POLICY "Authenticated users can delete workspace assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'workspace-assets' AND auth.uid() = owner);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- 1. Verify columns exist
SELECT 
    '✅ Columns Check' as test,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'workspaces'
  AND column_name IN ('cover_image', 'icon')
ORDER BY column_name;

-- Expected: 2 rows showing cover_image and icon

-- 2. Verify bucket is public
SELECT 
    '✅ Bucket Check' as test,
    id, 
    name, 
    public,
    CASE 
        WHEN public = true THEN '✅ Public (Good!)'
        ELSE '❌ Private (Fix needed!)'
    END as status
FROM storage.buckets 
WHERE id = 'workspace-assets';

-- Expected: public = true

-- 3. Verify storage policies
SELECT 
    '✅ Policies Check' as test,
    policyname,
    cmd as operation,
    CASE 
        WHEN roles = '{public}' THEN 'public'
        WHEN roles = '{authenticated}' THEN 'authenticated'
        ELSE roles::text
    END as roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%workspace assets%'
ORDER BY policyname;

-- Expected: 4 policies (INSERT, SELECT, UPDATE, DELETE)

-- 4. Check current workspaces
SELECT 
    '✅ Workspaces Check' as test,
    id,
    name,
    icon,
    CASE 
        WHEN cover_image IS NULL THEN '⚠️ No cover yet'
        WHEN cover_image = '' THEN '⚠️ Empty string'
        ELSE '✅ Has cover'
    END as cover_status,
    LEFT(cover_image, 60) as cover_preview
FROM workspaces
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 
    '🎉 SETUP COMPLETE!' as message,
    'Now test in your app:' as step_1,
    '1. Refresh dashboard' as step_2,
    '2. Click ⋮ on workspace' as step_3,
    '3. Click "Personalise"' as step_4,
    '4. Upload image & select icon' as step_5,
    '5. Click "Save Changes"' as step_6,
    '6. Refresh page - should persist!' as step_7;

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If columns still don't exist, check table name:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%work%';

-- If bucket doesn't exist, create it:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('workspace-assets', 'workspace-assets', true, 5242880)
-- ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- DONE!
-- ============================================
