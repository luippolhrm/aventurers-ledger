-- Drop the role column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Verify the change
SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
