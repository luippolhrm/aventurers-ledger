-- Disable RLS on profiles table
-- This fixes the "Failed to fetch" error when Supabase Auth tries to read user profiles

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Disable RLS on the profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
