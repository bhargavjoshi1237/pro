-- ⚠️⚠️⚠️ RUN THIS IN SUPABASE SQL EDITOR ⚠️⚠️⚠️
-- This fixes the "image and icon disappear on refresh" issue
-- Copy everything below and paste into Supabase SQL Editor, then click RUN

ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT;

UPDATE storage.buckets 
SET public = true 
WHERE id = 'workspace-assets';

-- ✅ DONE! Now refresh your app and try again.
