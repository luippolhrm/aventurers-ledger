-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'PLAYER' CHECK (role IN ('GM', 'PLAYER'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Add comment to explain the column
COMMENT ON COLUMN profiles.role IS 'User role: GM (Game Master) or PLAYER (Regular Player)';
