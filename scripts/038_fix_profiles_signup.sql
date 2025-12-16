-- ============================================================================
-- SCRIPT 038: Fix Profiles Sign-Up Issue
-- ============================================================================
-- Purpose: Permitir que nuevos usuarios se registren y creen su perfil
-- Issue: RLS está bloqueando INSERT en profiles durante sign-up
-- ============================================================================

-- Drop existing policy that might be blocking
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policy that allows signup
-- This allows INSERT when the id matches the authenticated user
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Also make sure service_role can insert (for triggers)
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Verify policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Intenta crear cuenta nuevamente
-- 3. Si sigue fallando, revisa Authentication settings en Supabase
-- ============================================================================
