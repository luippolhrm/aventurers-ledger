-- Drop ALL possible RLS policies on movements table that were created by previous scripts
-- This ensures no policies conflict with the disabled RLS

DROP POLICY IF EXISTS "movements_select_own" ON movements;
DROP POLICY IF EXISTS "movements_insert_own" ON movements;
DROP POLICY IF EXISTS "movements_update_own" ON movements;
DROP POLICY IF EXISTS "movements_delete_own" ON movements;
DROP POLICY IF EXISTS "users_access_own_movements" ON movements;
DROP POLICY IF EXISTS "users_select_own_movements" ON movements;
DROP POLICY IF EXISTS "users_insert_own_movements" ON movements;
DROP POLICY IF EXISTS "users_update_own_movements" ON movements;
DROP POLICY IF EXISTS "users_delete_own_movements" ON movements;

-- Ensure RLS is disabled on movements table
ALTER TABLE movements DISABLE ROW LEVEL SECURITY;
