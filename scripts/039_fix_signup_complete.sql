-- ============================================================================
-- SCRIPT 039: Fix Complete Sign-Up Flow
-- ============================================================================
-- Purpose: 
--   1. Arreglar políticas RLS en profiles
--   2. Crear profiles para usuarios existentes sin profile
--   3. Crear trigger automático para futuros sign-ups
-- ============================================================================

-- ====================
-- PASO 1: Arreglar Políticas RLS
-- ====================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Create new policy that allows signup
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Allow service_role to insert (for triggers and admin operations)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ====================
-- PASO 2: Crear Profiles para Usuarios Existentes
-- ====================

-- Crear profiles para todos los usuarios que no tienen uno
INSERT INTO profiles (id, display_name, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'display_name',
    split_part(au.email, '@', 1)
  ) as display_name,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ====================
-- PASO 3: Crear Trigger Automático
-- ====================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function that runs when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create trigger that fires on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ====================
-- VERIFICACIÓN
-- ====================

-- Ver usuarios sin profile (debería estar vacío después del PASO 2)
SELECT 
  'Usuarios sin profile' as status,
  COUNT(*) as count
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- Ver profiles creados
SELECT 
  'Profiles totales' as status,
  COUNT(*) as count
FROM profiles;

-- Ver políticas de profiles
SELECT 
  'Políticas en profiles' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- Ver si existe el trigger
SELECT 
  'Trigger creado' as info,
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ====================
-- RESULTADO ESPERADO
-- ====================
-- ✅ Usuarios sin profile: 0
-- ✅ Profiles totales: debe coincidir con número de usuarios
-- ✅ 2 políticas en profiles (insert own, service role)
-- ✅ 1 trigger: on_auth_user_created
-- ====================

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
