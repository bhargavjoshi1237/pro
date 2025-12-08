-- ============================================
-- RUN THIS IMMEDIATELY IN SUPABASE SQL EDITOR
-- This will fix the cover image and icon persistence issue
-- ============================================

-- Step 1: Add the columns (if they don't exist)
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Step 2: Verify columns were created
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'workspaces'
  AND column_name IN ('cover_image', 'icon', 'name', 'id')
ORDER BY column_name;

-- Expected output should show:
-- cover_image | text | YES
-- icon        | text | YES
-- id          | uuid | NO
-- name        | text | ...

-- Step 3: Check your current workspaces
SELECT 
    id,
    name,
    icon,
    cover_image,
    created_at
FROM workspaces
ORDER BY created_at DESC;

-- Step 4: Make storage bucket public (if not already)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'workspace-assets';

-- Step 5: Verify bucket is public
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'workspace-assets';
-- Should show: public = true

-- ============================================
-- DONE! Now test in your app:
-- 1. Refresh the dashboard
-- 2. Click ⋮ on a workspace
-- 3. Click "Personalise"
-- 4. Upload an image and select an icon
-- 5. Click "Save Changes"
-- 6. Refresh the page
-- 7. Image and icon should persist!
-- ============================================

-- If you still have issues, check the browser console (F12)
-- Look for messages starting with:
-- 💾 Saving workspace customization...
-- ✅ Saved successfully: ...
-- Or any error messages
