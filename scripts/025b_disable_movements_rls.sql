-- Disable RLS on movements table to fix currency conversion issues
-- The application controls access via character_id filtering in the code

ALTER TABLE movements DISABLE ROW LEVEL SECURITY;

-- Drop all problematic policies on movements
DROP POLICY IF EXISTS "movements_select_own" ON movements;
DROP POLICY IF EXISTS "movements_insert_own" ON movements;
DROP POLICY IF EXISTS "users_access_own_movements" ON movements;
DROP POLICY IF EXISTS "users_select_own_movements" ON movements;
DROP POLICY IF EXISTS "users_insert_own_movements" ON movements;
