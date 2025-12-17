-- ============================================================================
-- SCRIPT 049: Corregir políticas RLS de campaign_invitations
-- ============================================================================
-- Purpose: Las políticas RLS actuales intentan acceder a auth.users directamente,
--          lo cual causa errores de permisos. Este script crea una función helper
--          SECURITY DEFINER que puede acceder a auth.users y simplifica las políticas.
-- ============================================================================

-- Función helper para obtener el email del usuario actual
-- Esta función tiene SECURITY DEFINER, por lo que puede acceder a auth.users
-- Retorna NULL si el usuario no está autenticado o no se encuentra
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  current_user_id UUID;
BEGIN
  -- Verificar que hay un usuario autenticado
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Obtener email del usuario
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Retornar email en minúsculas o NULL si no se encontró
  RETURN CASE WHEN user_email IS NOT NULL THEN LOWER(user_email) ELSE NULL END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar políticas RLS problemáticas que acceden a auth.users directamente
DROP POLICY IF EXISTS "Users can view their invitations" ON campaign_invitations;
DROP POLICY IF EXISTS "Users can respond to invitations" ON campaign_invitations;

-- Recrear política para SELECT usando la función helper
-- Los usuarios pueden ver invitaciones donde:
-- 1. Son el invitee_id, O
-- 2. El invitee_email coincide con su email (usando función helper)
CREATE POLICY "Users can view their invitations"
  ON campaign_invitations FOR SELECT
  USING (
    invitee_id = auth.uid() 
    OR 
    (
      invitee_email IS NOT NULL 
      AND get_current_user_email() IS NOT NULL
      AND LOWER(invitee_email) = get_current_user_email()
    )
  );

-- Recrear política para UPDATE usando la función helper
CREATE POLICY "Users can respond to invitations"
  ON campaign_invitations FOR UPDATE
  USING (
    invitee_id = auth.uid() 
    OR 
    (
      invitee_email IS NOT NULL 
      AND get_current_user_email() IS NOT NULL
      AND LOWER(invitee_email) = get_current_user_email()
    )
  )
  WITH CHECK (
    invitee_id = auth.uid() 
    OR 
    (
      invitee_email IS NOT NULL 
      AND get_current_user_email() IS NOT NULL
      AND LOWER(invitee_email) = get_current_user_email()
    )
  );

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Verificar que la función existe
SELECT 
  'Función get_current_user_email creada' as status,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'get_current_user_email';

-- Verificar políticas RLS
SELECT 
  'Políticas RLS campaign_invitations' as info,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'campaign_invitations'
ORDER BY policyname;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Función get_current_user_email() creada con SECURITY DEFINER
-- ✅ Políticas RLS actualizadas para usar la función helper
-- ✅ No más errores de "permission denied for table users"
-- ============================================================================
