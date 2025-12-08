-- Setup script to ensure profiles table is ready for comments feature
-- Run this if you're seeing "Anonymous" users in comments

-- 1. Check if profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE 'Creating profiles table...';
    
    CREATE TABLE profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT,
      full_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ Profiles table created';
  ELSE
    RAISE NOTICE '✅ Profiles table already exists';
  END IF;
END $$;

-- 2. Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- 4. Create RLS policies for profiles
-- Anyone can view profiles (needed for comments to show names)
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Backfill profiles from auth.users for existing users
INSERT INTO profiles (id, email, full_name)
SELECT 
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    email
  ) as full_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

-- 6. Create trigger to auto-create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Verify setup
DO $$
DECLARE
  profile_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE 'Total users: %', user_count;
  RAISE NOTICE 'Total profiles: %', profile_count;
  
  IF profile_count = user_count THEN
    RAISE NOTICE '✅ All users have profiles';
  ELSE
    RAISE NOTICE '⚠️  Missing % profiles', (user_count - profile_count);
  END IF;
END $$;

-- 8. Show current user's profile
SELECT 
  '=== YOUR PROFILE ===' as info,
  id,
  email,
  full_name,
  CASE 
    WHEN full_name IS NOT NULL THEN '✅ Has name'
    ELSE '⚠️  No name set'
  END as status
FROM profiles 
WHERE id = auth.uid();

-- 9. Show sample of profiles
SELECT 
  '=== SAMPLE PROFILES ===' as info,
  id,
  email,
  full_name
FROM profiles 
LIMIT 5;

-- Final message
SELECT 
  '=== SETUP COMPLETE ===' as message,
  'Profiles are now ready for comments feature!' as status,
  'Try adding a comment - your name should appear correctly' as next_step;
